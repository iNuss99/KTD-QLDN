using techretail_api.Core.Models;
using techretail_api.Repositories;

namespace techretail_api.Services
{
    public class HrService : IHrService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<AttendanceRecord> _attendanceRepository;
        private readonly IRepository<PayrollRecord> _payrollRepository;

        public HrService(
            IRepository<User> userRepository,
            IRepository<AttendanceRecord> attendanceRepository,
            IRepository<PayrollRecord> payrollRepository)
        {
            _userRepository = userRepository;
            _attendanceRepository = attendanceRepository;
            _payrollRepository = payrollRepository;
        }

        public async Task<IEnumerable<User>> GetAllEmployeesAsync()
        {
            var users = await _userRepository.GetAllAsync();
            // In a real app we might filter by Role != Admin or similar, but let's return all users
            return users;
        }

        public async Task<User?> GetEmployeeByIdAsync(Guid id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task UpdateEmployeeHrInfoAsync(Guid id, DateTime? joinDate, int totalLeave, int usedLeave, decimal salary)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                user.JoinDate = joinDate;
                user.LeaveDaysTotal = totalLeave;
                user.LeaveDaysUsed = usedLeave;
                user.Salary = salary;
                _userRepository.Update(user);
                await _userRepository.SaveChangesAsync();
            }
        }

        public async Task<AttendanceRecord> CheckInAsync(Guid userId, string? notes = null)
        {
            var today = DateTime.UtcNow.Date;
            var record = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date == today);

            if (record != null) return record; // Already checked in today

            try
            {
                record = new AttendanceRecord
                {
                    UserId = userId,
                    Date = today,
                    CheckInTime = DateTime.UtcNow,
                    Status = "Present",
                    Notes = notes
                };
                await _attendanceRepository.AddAsync(record);
                await _attendanceRepository.SaveChangesAsync();
                return record;
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                // Unique constraint race condition — another concurrent request created the record first
                var existing = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date == today);
                return existing!;
            }
        }

        public async Task<AttendanceRecord> CheckOutAsync(Guid userId, string? notes = null)
        {
            var today = DateTime.UtcNow.Date;
            var record = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date == today);

            if (record != null)
            {
                record.CheckOutTime = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(notes))
                {
                    record.Notes = record.Notes == null ? notes : $"{record.Notes} | {notes}";
                }
                _attendanceRepository.Update(record);
                await _attendanceRepository.SaveChangesAsync();
                return record;
            }
            throw new Exception("Chưa check-in hôm nay.");
        }

        public async Task<IEnumerable<AttendanceRecord>> GetAttendanceByEmployeeAsync(Guid userId, int month, int year)
        {
            var records = await _attendanceRepository.FindAllAsync(a => a.UserId == userId && a.Date.Month == month && a.Date.Year == year);
            return records.OrderBy(a => a.Date);
        }

        public async Task<IEnumerable<AttendanceRecord>> GetAllAttendanceAsync(DateTime date)
        {
            var records = await _attendanceRepository.FindAllAsync(a => a.Date.Date == date.Date);
            return records;
        }

        public async Task<PayrollRecord> CalculatePayrollAsync(Guid userId, int month, int year)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) throw new Exception(" Không tìm thấy nhân viên.");

            var attendance = await _attendanceRepository.FindAllAsync(
                a => a.UserId == userId && a.Date.Month == month && a.Date.Year == year && a.CheckInTime != null);
            int daysPresent = attendance.Count();

            const int WORKING_DAYS_PER_MONTH = 22;
            decimal dailyRate = WORKING_DAYS_PER_MONTH > 0 ? user.Salary / WORKING_DAYS_PER_MONTH : 0;

            // Calculate deductions: absent days beyond approved leave entitlement
            int daysAbsent = Math.Max(0, WORKING_DAYS_PER_MONTH - daysPresent);
            int leaveDaysRemaining = Math.Max(0, user.LeaveDaysTotal - user.LeaveDaysUsed);
            int unauthorizedAbsent = Math.Max(0, daysAbsent - leaveDaysRemaining);

            decimal bonus = 0;
            decimal deductions = unauthorizedAbsent * dailyRate;
            decimal netPay = Math.Max(0, user.Salary + bonus - deductions);

            var payroll = await _payrollRepository.FindAsync(p => p.UserId == userId && p.Month == month && p.Year == year);

            if (payroll == null)
            {
                payroll = new PayrollRecord
                {
                    UserId = userId,
                    Month = month,
                    Year = year,
                    BaseSalary = user.Salary,
                    Bonus = bonus,
                    Deductions = deductions,
                    NetPay = netPay,
                    Status = "Pending"
                };
                await _payrollRepository.AddAsync(payroll);
            }
            else
            {
                if (payroll.Status == "Paid")
                    throw new InvalidOperationException("Bảng lương táng này đã được thanh toán, không thể tính lại.");
                payroll.BaseSalary = user.Salary;
                payroll.Deductions = deductions;
                payroll.NetPay = netPay;
                _payrollRepository.Update(payroll);
            }

            await _payrollRepository.SaveChangesAsync();
            return payroll;
        }

        public async Task<IEnumerable<PayrollRecord>> GetPayrollByMonthAsync(int month, int year)
        {
            return await _payrollRepository.FindAllAsync(p => p.Month == month && p.Year == year);
        }

        public async Task<PayrollRecord> MarkPayrollAsPaidAsync(Guid payrollId)
        {
            var payroll = await _payrollRepository.GetByIdAsync(payrollId);
            if (payroll == null)
                throw new KeyNotFoundException($"Bảng lương không tồn tại.");

            if (payroll.Status == "Paid")
                throw new InvalidOperationException("Bảng lương này đã được đánh dấu là đã thanh toán.");

            payroll.Status = "Paid";
            payroll.PaymentDate = DateTime.UtcNow;
            _payrollRepository.Update(payroll);
            await _payrollRepository.SaveChangesAsync();
            return payroll;
        }
    }
}
