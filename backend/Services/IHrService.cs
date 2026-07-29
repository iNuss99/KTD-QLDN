using techretail_api.Core.Models;

namespace techretail_api.Services
{
    public interface IHrService
    {
        // Employees
        Task<IEnumerable<User>> GetAllEmployeesAsync();
        Task<User?> GetEmployeeByIdAsync(Guid id);
        Task UpdateEmployeeHrInfoAsync(Guid id, DateTime? joinDate, int totalLeave, int usedLeave, decimal salary);

        // Attendance
        Task<AttendanceRecord> CheckInAsync(Guid userId, string? notes = null);
        Task<AttendanceRecord> CheckOutAsync(Guid userId, string? notes = null);
        Task<IEnumerable<AttendanceRecord>> GetAttendanceByEmployeeAsync(Guid userId, int month, int year);
        Task<IEnumerable<AttendanceRecord>> GetAllAttendanceAsync(DateTime date);

        // Payroll
        Task<PayrollRecord> CalculatePayrollAsync(Guid userId, int month, int year);
        Task<IEnumerable<PayrollRecord>> GetPayrollByMonthAsync(int month, int year);
        Task<PayrollRecord> MarkPayrollAsPaidAsync(Guid payrollId);
    }
}
