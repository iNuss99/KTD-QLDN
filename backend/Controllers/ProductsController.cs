using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using techretail_api.Models;
using techretail_api.Services;

namespace techretail_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly IProductsService _productsService;

        public ProductsController(IProductsService productsService)
        {
            _productsService = productsService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<Product>>> GetProducts([FromQuery] string? search, [FromQuery] bool lowStockOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            if (pageSize > 100) pageSize = 100;
            bool maskCostPrice = User.IsInRole("Warehouse Staff") || User.IsInRole("Sales Staff") || User.IsInRole("Accountant");
            bool maskSellingPrice = User.IsInRole("Warehouse Staff");
            var products = await _productsService.GetProductsAsync(search, lowStockOnly, page, pageSize, maskCostPrice, maskSellingPrice);
            return Ok(products);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            var createdProduct = await _productsService.CreateProductAsync(product);
            return CreatedAtAction(nameof(GetProducts), new { id = createdProduct.Id }, createdProduct);
        }

        [HttpPut("{id}/stock")]
        [Authorize(Roles = "Admin,Manager,Warehouse Staff,Accountant")]
        public async Task<IActionResult> UpdateStock(Guid id, [FromBody] UpdateStockRequest request)
        {
            try
            {
                var userIdString = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (!Guid.TryParse(userIdString, out var userId))
                {
                    return Unauthorized(new { message = "Invalid token claims" });
                }

                await _productsService.UpdateStockAsync(id, request.Quantity, request.Reason, userId, request.RowVersion, request.NewCostPrice);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/stock-history")]
        [Authorize(Roles = "Admin,Manager,Warehouse Staff")]
        public async Task<ActionResult<IEnumerable<StockAdjustment>>> GetStockHistory(Guid id)
        {
            var history = await _productsService.GetStockHistoryAsync(id);
            return Ok(history);
        }
    }

    public class UpdateStockRequest
    {
        public int Quantity { get; set; }
        public string Reason { get; set; } = string.Empty;
        public byte[]? RowVersion { get; set; }
        public decimal? NewCostPrice { get; set; }
    }
}
