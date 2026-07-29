using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;

namespace techretail_api.Services
{
    public class SearchService : ISearchService
    {
        private readonly AppDbContext _context;

        public SearchService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SearchResultDto> GlobalSearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new SearchResultDto();
            }

            var lowerQuery = query.ToLower();

            // Fire queries concurrently
            var usersTask = _context.Users
                .Where(u => u.FullName.ToLower().Contains(lowerQuery) || u.Email.ToLower().Contains(lowerQuery))
                .Include(u => u.Role)
                .Take(5)
                .Select(u => new UserSearchDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role != null ? u.Role.RoleName : ""
                })
                .ToListAsync();

            var productsTask = _context.Products
                .Where(p => p.ProductName.ToLower().Contains(lowerQuery) || p.SKU.ToLower().Contains(lowerQuery))
                .Take(5)
                .Select(p => new ProductSearchDto
                {
                    Id = p.Id,
                    Name = p.ProductName,
                    Sku = p.SKU,
                    Category = ""
                })
                .ToListAsync();

            var ordersTask = _context.Orders
                .Where(o => o.OrderCode.ToLower().Contains(lowerQuery) || o.CustomerName.ToLower().Contains(lowerQuery))
                .Take(5)
                .Select(o => new OrderSearchDto
                {
                    Id = o.Id,
                    OrderCode = o.OrderCode,
                    CustomerName = o.CustomerName,
                    Status = o.OrderStatus
                })
                .ToListAsync();

            await Task.WhenAll(usersTask, productsTask, ordersTask);

            return new SearchResultDto
            {
                Users = await usersTask,
                Products = await productsTask,
                Orders = await ordersTask
            };
        }
    }
}
