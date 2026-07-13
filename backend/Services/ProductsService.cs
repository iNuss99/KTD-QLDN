using Microsoft.EntityFrameworkCore;
using techretail_api.Data;
using techretail_api.Models;

namespace techretail_api.Services
{
    public interface IProductsService
    {
        Task<PagedResult<Product>> GetProductsAsync(string? search = null, bool lowStockOnly = false, int page = 1, int pageSize = 100, bool maskCostPrice = false, bool maskSellingPrice = false);
        Task<Product> CreateProductAsync(Product product);
        Task UpdateStockAsync(Guid id, int newQuantity, string reason, Guid adjustedBy, byte[]? rowVersion = null, decimal? newCostPrice = null);
        Task<IEnumerable<StockAdjustment>> GetStockHistoryAsync(Guid id);
    }

    public class ProductsService : IProductsService
    {
        private readonly AppDbContext _context;

        public ProductsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Product>> GetProductsAsync(string? search = null, bool lowStockOnly = false, int page = 1, int pageSize = 100, bool maskCostPrice = false, bool maskSellingPrice = false)
        {
            var query = _context.Products.Where(p => !p.IsDeleted).AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.ProductName.Contains(search) || p.SKU.Contains(search));
            }

            if (lowStockOnly)
            {
                query = query.Where(p => p.StockQuantity <= 10);
            }

            int totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(p => p.LastUpdated)
                              .Skip((page - 1) * pageSize)
                              .Take(pageSize)
                              .ToListAsync();

            if (maskCostPrice || maskSellingPrice)
            {
                foreach (var product in items)
                {
                    if (maskCostPrice) product.CostPrice = 0;
                    if (maskSellingPrice) product.SellingPrice = 0;
                }
            }

            return new PagedResult<Product>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            product.Id = Guid.NewGuid();
            product.LastUpdated = DateTime.UtcNow;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task UpdateStockAsync(Guid id, int newQuantity, string reason, Guid adjustedBy, byte[]? rowVersion = null, decimal? newCostPrice = null)
        {
            if (string.IsNullOrWhiteSpace(reason)) throw new Exception("Reason is required for stock adjustment.");

            var product = await _context.Products.FindAsync(id);
            if (product == null) throw new Exception("Product not found");

            if (rowVersion != null)
            {
                _context.Entry(product).Property(p => p.RowVersion).OriginalValue = rowVersion;
            }

            var adjustment = new StockAdjustment
            {
                ProductId = id,
                AdjustedBy = adjustedBy,
                OldQuantity = product.StockQuantity,
                NewQuantity = newQuantity,
                Reason = reason,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.StockAdjustments.Add(adjustment);

            product.StockQuantity = newQuantity;
            if (newCostPrice.HasValue)
            {
                product.CostPrice = newCostPrice.Value;
            }
            product.LastUpdated = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new Exception("Stock was updated by another user. Please refresh and try again.");
            }
        }

        public async Task<IEnumerable<StockAdjustment>> GetStockHistoryAsync(Guid id)
        {
            return await _context.StockAdjustments
                .Include(sa => sa.User)
                .Where(sa => sa.ProductId == id)
                .OrderByDescending(sa => sa.CreatedAt)
                .ToListAsync();
        }
    }
}
