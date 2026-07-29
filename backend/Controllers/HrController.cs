using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using techretail_api.Core.Models;
using techretail_api.Services;

namespace techretail_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HrController : ControllerBase
    {
        private readonly IHrService _hrService;

        public HrController(IHrService hrService)
        {
            _hrService = hrService;
        }

        [HttpGet("employees")]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _hrService.GetAllEmployeesAsync();
            return Ok(employees);
        }

        [HttpGet("employees/{id}")]
        public async Task<IActionResult> GetEmployeeById(Guid id)
        {
            var employee = await _hrService.GetEmployeeByIdAsync(id);
            if (employee == null) return NotFound();
            return Ok(employee);
        }

        [HttpPut("employees/{id}")]
        public async Task<IActionResult> UpdateEmployeeHrInfo(Guid id, [FromBody] UpdateHrInfoRequest request)
        {
            await _hrService.UpdateEmployeeHrInfoAsync(id, request.JoinDate, request.LeaveDaysTotal, request.LeaveDaysUsed, request.Salary);
            return NoContent();
        }

        [HttpPost("attendance/checkin")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInOutRequest request)
        {
            var record = await _hrService.CheckInAsync(request.UserId, request.Notes);
            return Ok(record);
        }

        [HttpPost("attendance/checkout")]
        public async Task<IActionResult> CheckOut([FromBody] CheckInOutRequest request)
        {
            try
            {
                var record = await _hrService.CheckOutAsync(request.UserId, request.Notes);
                return Ok(record);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("attendance/user/{userId}")]
        public async Task<IActionResult> GetUserAttendance(Guid userId, [FromQuery] int month, [FromQuery] int year)
        {
            var records = await _hrService.GetAttendanceByEmployeeAsync(userId, month, year);
            return Ok(records);
        }

        [HttpGet("attendance/daily")]
        public async Task<IActionResult> GetDailyAttendance([FromQuery] DateTime date)
        {
            var records = await _hrService.GetAllAttendanceAsync(date);
            return Ok(records);
        }

        [HttpPost("payroll/calculate")]
        public async Task<IActionResult> CalculatePayroll([FromBody] CalculatePayrollRequest request)
        {
            var payroll = await _hrService.CalculatePayrollAsync(request.UserId, request.Month, request.Year);
            return Ok(payroll);
        }

        [HttpGet("payroll")]
        public async Task<IActionResult> GetPayrollByMonth([FromQuery] int month, [FromQuery] int year)
        {
            var records = await _hrService.GetPayrollByMonthAsync(month, year);
            return Ok(records);
        }

        [HttpPut("payroll/{id}/pay")]
        public async Task<IActionResult> MarkPayrollAsPaid(Guid id)
        {
            var payroll = await _hrService.MarkPayrollAsPaidAsync(id);
            return Ok(payroll);
        }
    }

    public class UpdateHrInfoRequest
    {
        public DateTime? JoinDate { get; set; }
        public int LeaveDaysTotal { get; set; }
        public int LeaveDaysUsed { get; set; }
        public decimal Salary { get; set; }
    }

    public class CheckInOutRequest
    {
        public Guid UserId { get; set; }
        public string? Notes { get; set; }
    }

    public class CalculatePayrollRequest
    {
        public Guid UserId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
    }
}
