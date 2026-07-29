using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;
using System;
using System.Linq;
using System.Collections.Generic;

namespace techretail_api.Infrastructure.Database.Seeders
{
    public static class PayrollSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            if (dbContext.PayrollRecords.Count() < 5)
            {
                var users = dbContext.Users.ToList();
                if (users.Count == 0) return;

                var records = new List<PayrollRecord>();
                var random = new Random();
                var currentMonth = DateTime.UtcNow.Month;
                var currentYear = DateTime.UtcNow.Year;

                foreach (var user in users)
                {
                    // Random base salary between 10M and 30M
                    decimal baseSalary = random.Next(10, 31) * 1000000m;

                    // Generate payroll for last month
                    int lastMonth = currentMonth == 1 ? 12 : currentMonth - 1;
                    int lastMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;

                    decimal bonus = random.Next(0, 5) * 1000000m;
                    decimal deductions = random.Next(0, 3) * 500000m;

                    records.Add(new PayrollRecord
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Month = lastMonth,
                        Year = lastMonthYear,
                        BaseSalary = baseSalary,
                        Bonus = bonus,
                        Deductions = deductions,
                        NetPay = baseSalary + bonus - deductions,
                        Status = "Paid",
                        PaymentDate = new DateTime(lastMonthYear, lastMonth, 5, 0, 0, 0, DateTimeKind.Utc).AddMonths(1),
                        CreatedAt = new DateTime(lastMonthYear, lastMonth, 28, 0, 0, 0, DateTimeKind.Utc)
                    });

                    // Generate payroll for current month
                    decimal bonusCurrent = random.Next(0, 5) * 1000000m;
                    decimal deductionsCurrent = random.Next(0, 3) * 500000m;

                    records.Add(new PayrollRecord
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Month = currentMonth,
                        Year = currentYear,
                        BaseSalary = baseSalary,
                        Bonus = bonusCurrent,
                        Deductions = deductionsCurrent,
                        NetPay = baseSalary + bonusCurrent - deductionsCurrent,
                        Status = "Pending",
                        PaymentDate = null,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    });
                }

                dbContext.PayrollRecords.AddRange(records);
                dbContext.SaveChanges();
            }
        }
    }
}
