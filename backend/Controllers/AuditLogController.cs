using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;

namespace techretail_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditLogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách nhật ký kiểm toán với phân trang và bộ lọc — chỉ Admin
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? action = null,
            [FromQuery] string? severity = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (pageSize > 100) pageSize = 100;

            var query = _context.SystemLogs
                .Include(l => l.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(action))
                query = query.Where(l => l.ActionType == action);

            if (!string.IsNullOrEmpty(severity))
                query = query.Where(l => l.SeverityLevel == severity);

            if (from.HasValue)
            {
                var fromUtc = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
                query = query.Where(l => l.CreatedAt >= fromUtc);
            }

            if (to.HasValue)
            {
                var toUtc = DateTime.SpecifyKind(to.Value.Date.AddDays(1), DateTimeKind.Utc);
                query = query.Where(l => l.CreatedAt < toUtc);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(l =>
                    l.ActionType.Contains(search) ||
                    l.TableName.Contains(search) ||
                    (l.NewValues != null && l.NewValues.Contains(search)) ||
                    (l.OldValues != null && l.OldValues.Contains(search)) ||
                    (l.User != null && l.User.FullName.Contains(search))
                );
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    l.UserId,
                    userEmail = l.User != null ? l.User.Email : null,
                    userFullName = l.User != null ? l.User.FullName : null,
                    l.ActionType,
                    l.TableName,
                    l.OldValues,
                    l.NewValues,
                    l.SeverityLevel,
                    l.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Xuất nhật ký kiểm toán ra CSV — chỉ Admin
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv()
        {
            var logs = await _context.SystemLogs
                .Include(l => l.User)
                .OrderByDescending(l => l.CreatedAt)
                .Take(5000) // Giới hạn 5000 dòng xuất
                .ToListAsync();

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Thời gian,Người dùng,Email,Hành động,Đối tượng,Mức độ,Giá trị cũ,Giá trị mới");

            foreach (var log in logs)
            {
                var createdAt = log.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                var fullName = log.User?.FullName ?? string.Empty;
                var email = log.User?.Email ?? log.UserId.ToString();
                var oldVal = (log.OldValues ?? string.Empty).Replace("\"", "\"\"");
                var newVal = (log.NewValues ?? string.Empty).Replace("\"", "\"\"");

                csv.AppendLine($"\"{createdAt}\",\"{fullName}\",\"{email}\",\"{log.ActionType}\",\"{log.TableName}\",\"{log.SeverityLevel}\",\"{oldVal}\",\"{newVal}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"AuditLog_{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
