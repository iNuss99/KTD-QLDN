using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using techretail_api.Repositories;
using techretail_api.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace techretail_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IRepository<Order> _orderRepository;
        private readonly IRepository<SystemLog> _systemLogRepository;

        public ReportsController(IRepository<Order> orderRepository, IRepository<SystemLog> systemLogRepository)
        {
            _orderRepository = orderRepository;
            _systemLogRepository = systemLogRepository;
        }

        [HttpGet("staff-sales")]
         
        public IActionResult GetStaffSales([FromQuery] string period = "day")
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var query = _orderRepository.Query().Where(o => o.CreatedBy == userId);
            
            DateTime startDate = DateTime.UtcNow;
            switch (period.ToLower())
            {
                case "day":
                    startDate = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
                    break;
                case "week":
                    startDate = DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek), DateTimeKind.Utc);
                    break;
                case "month":
                    startDate = DateTime.SpecifyKind(new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1), DateTimeKind.Utc);
                    break;
                case "quarter":
                    int quarter = (DateTime.UtcNow.Month - 1) / 3 + 1;
                    startDate = DateTime.SpecifyKind(new DateTime(DateTime.UtcNow.Year, (quarter - 1) * 3 + 1, 1), DateTimeKind.Utc);
                    break;
                default:
                    startDate = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
                    break;
            }

            query = query.Where(o => o.CreatedAt >= startDate);
            
            var totalOrders = query.Count();
            var completedOrders = query.Count(o => o.OrderStatus == "Delivered");
            var pendingOrders = query.Count(o => o.OrderStatus == "Pending" || o.OrderStatus == "Confirmed" || o.OrderStatus == "Shipped");
            var cancelledOrders = query.Count(o => o.OrderStatus == "Cancelled");
            var totalRevenue = query.Where(o => o.OrderStatus == "Confirmed" || o.OrderStatus == "Shipped" || o.OrderStatus == "Delivered").Sum(o => o.TotalAmount);
            var recentOrders = query.OrderByDescending(o => o.CreatedAt).Take(5).ToList();

            var result = new
            {
                totalOrders,
                completedOrders,
                pendingOrders,
                cancelledOrders,
                totalRevenue,
                recentOrders
            };

            return Ok(result);
        }

        [HttpPost("staff-sales/submit")]
         
        public async Task<IActionResult> SubmitStaffReport([FromBody] SubmitReportRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var log = new SystemLog
            {
                UserId = userId,
                ActionType = "SEND_REPORT",
                TableName = "Reports",
                OldValues = null,
                NewValues = $"{{ \"period\": \"{request.Period}\", \"note\": \"{request.Note}\" }}",
                SeverityLevel = "Normal",
                CreatedAt = DateTime.UtcNow
            };

            await _systemLogRepository.AddAsync(log);

            return Ok(new { message = "Báo cáo doanh thu đã được gửi thành công" });
        }

        [HttpGet("finance/export")]
        
        public async Task<IActionResult> GetFinanceExport()
        {
            var orders = await _orderRepository.Query()
                .Where(o => o.OrderStatus == "Confirmed" || o.OrderStatus == "Shipped" || o.OrderStatus == "Delivered")
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var csvBuilder = new System.Text.StringBuilder();
            csvBuilder.AppendLine("Order Code,Customer Name,Status,Total Amount,Created At");

            foreach (var order in orders)
            {
                var createdAt = order.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                var amount = order.TotalAmount.ToString("0.00");
                csvBuilder.AppendLine($"{order.OrderCode},{order.CustomerName},{order.OrderStatus},{amount},{createdAt}");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csvBuilder.ToString());
            return File(bytes, "text/csv", $"Finance_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }

    public class SubmitReportRequest
    {
        public string Period { get; set; } = "day";
        public string? Note { get; set; }
    }
}
