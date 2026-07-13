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
    public class OrdersController : ControllerBase
    {
        private readonly IOrdersService _ordersService;

        public OrdersController(IOrdersService ordersService)
        {
            _ordersService = ordersService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<Order>>> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? status = null, [FromQuery] string? search = null)
        {
            if (pageSize > 100) pageSize = 100;
            bool maskFinancialData = User.IsInRole("Warehouse Staff") || User.IsInRole("Sales Staff");
            bool isSalesStaff = User.IsInRole("Sales Staff");
            var orders = await _ordersService.GetOrdersAsync(page, pageSize, status, search, maskFinancialData, isSalesStaff);
            return Ok(orders);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Sales Staff")]
        public async Task<ActionResult<Order>> PostOrder(Order order)
        {
            try
            {
                var createdOrder = await _ordersService.CreateOrderAsync(order);
                return CreatedAtAction(nameof(GetOrders), new { id = createdOrder.Id }, createdOrder);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin,Manager,Sales Staff")]
        public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var userIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
                Guid.TryParse(userIdStr, out var userId);
                bool isAdminOrManager = User.IsInRole("Admin") || User.IsInRole("Manager");
                await _ordersService.UpdateOrderStatusAsync(id, request.Status, request.Reason, isAdminOrManager, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteOrder(Guid id)
        {
            try
            {
                await _ordersService.DeleteOrderAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
