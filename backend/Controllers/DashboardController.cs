using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using techretail_api.Services;

namespace techretail_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("kpis")]
        public async Task<ActionResult<object>> GetKPIs()
        {
            var result = await _dashboardService.GetKPIsAsync();
            return Ok(result);
        }

        [HttpGet("revenue-chart")]
        public async Task<ActionResult<IEnumerable<object>>> GetRevenueChart()
        {
            var result = await _dashboardService.GetRevenueChartAsync();
            return Ok(result);
        }

        [HttpGet("margin-details")]
        public async Task<ActionResult<object>> GetMarginDetails([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            var result = await _dashboardService.GetMarginDetailsAsync(page, pageSize);
            return Ok(result);
        }

        [HttpPost("seed")]
        [AllowAnonymous]
        public async Task<IActionResult> Seed()
        {
            await _dashboardService.SeedDataAsync();
            return Ok("Seeded successfully");
        }
    }
}
