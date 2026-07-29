using System.Diagnostics;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HealthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var sw = Stopwatch.StartNew();
            bool isDbHealthy = false;
            
            try
            {
                // Thực thi 1 query cực nhẹ để đánh thức (wake up) Neon Postgres từ trạng thái suspend
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");
                isDbHealthy = true;
            }
            catch
            {
                isDbHealthy = false;
            }

            sw.Stop();

            // Trả về object đơn giản, không chứa thông tin nhạy cảm (stack trace, connection string)
            return Ok(new
            {
                status = isDbHealthy ? "ok" : "degraded",
                database = isDbHealthy ? "connected" : "disconnected",
                timestamp = DateTime.UtcNow,
                ping_ms = sw.ElapsedMilliseconds
            });
        }
    }
}
