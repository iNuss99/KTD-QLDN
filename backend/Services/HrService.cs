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
            var records = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date == today);
            var record = records.FirstOrDefault();

            if (record == null)
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
            }
            return record;
        }

        public async Task<AttendanceRecord> CheckOutAsync(Guid userId, string? notes = null)
        {
            var today = DateTime.UtcNow.Date;
            var records = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date == today);
            var record = records.FirstOrDefault();

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
            var records = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date.Month == month && a.Date.Year == year);
            return records.OrderBy(a => a.Date);
        }

        public async Task<IEnumerable<AttendanceRecord>> GetAllAttendanceAsync(DateTime date)
        {
            var records = await _attendanceRepository.FindAsync(a => a.Date.Date == date.Date);
            return records;
        }

        public async Task<PayrollRecord> CalculatePayrollAsync(Guid userId, int month, int year)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) throw new Exception("Không tìm thấy nhân viên.");

            // Basic calculation:
            // Assuming 22 working days. Find how many days present.
            var attendance = await _attendanceRepository.FindAsync(a => a.UserId == userId && a.Date.Month == month && a.Date.Year == year && a.CheckInTime != null);
            int daysPresent = attendance.Count();
            
            // Simple formula: Salary / 22 * daysPresent
            // But if Salary is monthly, and they didn't take leave, we just pay base salary.
            // Let's do a simple calculation:
            decimal dailyRate = user.Salary / 22m;
            decimal calculatedSalary = user.Salary; 

            // If days absent without leave > 0, deduct. (Simplified)
            // Just use user.Salary for now.
            decimal bonus = 0;
            decimal deductions = 0;
            decimal netPay = user.Salary + bonus - deductions;

            var existingRecords = await _payrollRepository.FindAsync(p => p.UserId == userId && p.Month == month && p.Year == year);
            var payroll = existingRecords.FirstOrDefault();

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
                payroll.BaseSalary = user.Salary;
                payroll.NetPay = netPay;
                _payrollRepository.Update(payroll);
            }

            await _payrollRepository.SaveChangesAsync();
            return payroll;
        }

        public async Task<IEnumerable<PayrollRecord>> GetPayrollByMonthAsync(int month, int year)
        {
            return await _payrollRepository.FindAsync(p => p.Month == month && p.Year == year);
        }

        public async Task<PayrollRecord> MarkPayrollAsPaidAsync(Guid payrollId)
        {
            var payroll = await _payrollRepository.GetByIdAsync(payrollId);
            if (payroll != null)
            {
                payroll.Status = "Paid";
                payroll.PaymentDate = DateTime.UtcNow;
                _payrollRepository.Update(payroll);
                await _payrollRepository.SaveChangesAsync();
            }
            return payroll!;
        }
    }
}
