using Microsoft.EntityFrameworkCore;
using techretail_api.Data;

namespace techretail_api.Services
{
    public interface IFinanceService
    {
        Task<IEnumerable<object>> GetMonthlyGrowthAsync();
        Task<IEnumerable<object>> GetExpenseCategoriesAsync();
        Task<techretail_api.Models.Expense> AddExpenseAsync(techretail_api.Models.Expense expense);
    }

    public class FinanceService : IFinanceService
    {
        private readonly AppDbContext _context;

        public FinanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<object>> GetMonthlyGrowthAsync()
        {
            var result = new List<object>();
            var months = new[] { "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12" };
            
            var currentMonth = DateTime.UtcNow.Month;
            
            var activeUsersSalary = await _context.Users
                .Where(u => u.IsActive)
                .SumAsync(u => u.Salary);

            for (int i = 5; i >= 0; i--)
            {
                var targetMonth = currentMonth - i;
                var year = DateTime.UtcNow.Year;
                if (targetMonth <= 0)
                {
                    targetMonth += 12;
                    year--;
                }

                var rev = await _context.Orders
                    .Where(o => o.CreatedAt.Month == targetMonth && o.CreatedAt.Year == year && o.OrderStatus == "Delivered")
                    .SumAsync(o => o.TotalAmount);

                var exp = await _context.Expenses
                    .Where(e => e.Date.Month == targetMonth && e.Date.Year == year)
                    .SumAsync(e => e.Amount);

                exp += activeUsersSalary; // Add dynamic payroll

                result.Add(new
                {
                    month = months[targetMonth - 1],
                    revenue = rev,
                    expenses = exp
                });
            }

            return result;
        }

        public async Task<IEnumerable<object>> GetExpenseCategoriesAsync()
        {
            var activeUsersSalary = await _context.Users
                .Where(u => u.IsActive)
                .SumAsync(u => u.Salary);

            var totalExpenses = await _context.Expenses.SumAsync(e => e.Amount) + activeUsersSalary;
            if (totalExpenses == 0) totalExpenses = 1;

            var categoriesDb = await _context.Expenses
                .GroupBy(e => e.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    Amount = g.Sum(e => e.Amount)
                })
                .ToListAsync();

            string TranslateCategory(string category)
            {
                if (category == "Infrastructure") return "Khác";
                if (category == "Payroll") return "Lương";
                if (category == "R&D") return "Nghiên cứu & Phát triển";
                if (category == "Khác (Others)") return "Khác";
                return category;
            }

            var mappedCategories = categoriesDb
                .GroupBy(c => TranslateCategory(c.Category))
                .Select(g => new
                {
                    Category = g.Key,
                    Amount = g.Sum(x => x.Amount)
                })
                .ToList();

            var payrollCategory = mappedCategories.FirstOrDefault(c => c.Category == "Lương");
            if (payrollCategory != null)
            {
                mappedCategories.Remove(payrollCategory);
                mappedCategories.Add(new { Category = "Lương", Amount = payrollCategory.Amount + activeUsersSalary });
            }
            else if (activeUsersSalary > 0)
            {
                mappedCategories.Add(new { Category = "Lương", Amount = activeUsersSalary });
            }

            var categories = mappedCategories.ToList();

            var colorMap = new Dictionary<string, string>
            {
                { "Lương", "#c3c0ff" },
                { "Marketing", "#dae2fd" },
                { "Nghiên cứu & Phát triển", "#cbdbf5" },
                { "Khác", "#94a3b8" }
            };

            var result = categories.Select(c => new
            {
                name = c.Category,
                value = c.Amount,
                percentage = Math.Round((c.Amount / totalExpenses) * 100, 1),
                color = colorMap.ContainsKey(c.Category) ? colorMap[c.Category] : "#94a3b8"
            }).OrderByDescending(c => c.value).ToList();

            // If empty, return a default mock so UI doesn't crash
            if (!result.Any())
            {
                return new[]
                {
                    new { name = "Khác", value = 0m, percentage = 100m, color = "#94a3b8" }
                };
            }

            return result;
        }

        public async Task<techretail_api.Models.Expense> AddExpenseAsync(techretail_api.Models.Expense expense)
        {
            if (string.IsNullOrEmpty(expense.Category))
                throw new ArgumentException("Category is required");
            if (expense.Amount <= 0)
                throw new ArgumentException("Amount must be greater than zero");

            expense.Date = expense.Date == default ? DateTime.UtcNow : expense.Date;

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return expense;
        }
    }
}
