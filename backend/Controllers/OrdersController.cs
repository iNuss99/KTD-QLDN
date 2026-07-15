using techretail_api.Core.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using techretail_api.Core.Models;
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
        [RequiresPermission("perm-5")]
        public async Task<ActionResult<PagedResult<Order>>> GetOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? createdBy = null)
        {
            if (pageSize > 100) pageSize = 100;
            bool maskFinancialData = User.IsInRole("Warehouse Staff") || User.IsInRole("Sales Staff");
            bool isSalesStaff = User.IsInRole("Sales Staff");
            var orders = await _ordersService.GetOrdersAsync(page, pageSize, status, search, maskFinancialData, isSalesStaff, fromDate, toDate, createdBy);
            return Ok(orders);
        }

        [HttpPost]
        [RequiresPermission("perm-6")]
        public async Task<ActionResult<Order>> PostOrder(Order order)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (Guid.TryParse(userIdStr, out var userId))
                    order.CreatedBy = userId;

                var createdOrder = await _ordersService.CreateOrderAsync(order);
                return CreatedAtAction(nameof(GetOrders), new { id = createdOrder.Id }, createdOrder);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        [RequiresPermission("perm-6")]
        public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
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

        [HttpPost("bulk-status-update")]
        [RequiresPermission("perm-6")]
        public async Task<IActionResult> BulkStatusUpdate([FromBody] BulkStatusUpdateRequest request)
        {
            if (request.OrderIds == null || request.OrderIds.Count == 0)
                return BadRequest(new { message = "Không có đơn hàng nào được chọn" });

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdStr, out var userId);
            bool isAdminOrManager = User.IsInRole("Admin") || User.IsInRole("Manager");

            var errors = new List<string>();
            int success = 0;

            foreach (var orderId in request.OrderIds)
            {
                try
                {
                    await _ordersService.UpdateOrderStatusAsync(orderId, request.NewStatus, request.Reason, isAdminOrManager, userId);
                    success++;
                }
                catch (Exception ex)
                {
                    errors.Add($"{orderId}: {ex.Message}");
                }
            }

            return Ok(new
            {
                message = $"Cập nhật thành công {success}/{request.OrderIds.Count} đơn hàng",
                successCount = success,
                errors
            });
        }

        [HttpDelete("{id}")]
        [RequiresPermission("perm-6")]
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

    public class BulkStatusUpdateRequest
    {
        public List<Guid> OrderIds { get; set; } = new();
        public string NewStatus { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
