using techretail_api.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using techretail_api.Services;

namespace techretail_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FinanceController : ControllerBase
    {
        private readonly IFinanceService _financeService;

        public FinanceController(IFinanceService financeService)
        {
            _financeService = financeService;
        }

        [HttpGet("growth")]
        
        public async Task<ActionResult<IEnumerable<object>>> GetMonthlyGrowth()
        {
            var result = await _financeService.GetMonthlyGrowthAsync();
            var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            
            if (role == "Manager")
            {
                // Manager only sees revenue
                var mapped = result.Select(r => {
                    dynamic row = r;
                    return new { month = row.month, revenue = row.revenue, expenses = 0 };
                });
                return Ok(mapped);
            }
            return Ok(result);
        }

        [HttpGet("categories")]
         // Manager cannot see cost breakdown at all
        public async Task<ActionResult<IEnumerable<object>>> GetExpenseCategories()
        {
            var result = await _financeService.GetExpenseCategoriesAsync();
            return Ok(result);
        }

        [HttpPost("expenses")]
        
        public async Task<IActionResult> AddExpense([FromBody] techretail_api.Models.Expense request)
        {
            try
            {
                var newExpense = await _financeService.AddExpenseAsync(request);
                return CreatedAtAction(nameof(AddExpense), new { id = newExpense.Id }, newExpense);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}

