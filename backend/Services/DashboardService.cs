using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;

namespace techretail_api.Services
{
    public interface IDashboardService
    {
        Task<object> GetKPIsAsync();
        Task<IEnumerable<object>> GetRevenueChartAsync();
        Task<object> GetMarginDetailsAsync(int page, int pageSize);
        Task SeedDataAsync();
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetKPIsAsync()
        {
            var completedOrders = await _context.Orders
                .Include(o => o.OrderDetails)
                .Where(o => o.OrderStatus == "Delivered")
                .ToListAsync();

            var totalRevenue = completedOrders.Sum(o => o.TotalAmount);
            var totalCogs = completedOrders.SelectMany(o => o.OrderDetails).Sum(d => d.UnitCost * d.Quantity);
            var grossProfit = totalRevenue - totalCogs;
            var margin = totalRevenue > 0 ? Math.Round((grossProfit / totalRevenue) * 100, 1) : 0;
            
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            var lastMonth = currentMonth == 1 ? 12 : currentMonth - 1;
            var lastMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;

            var currentMonthOrders = completedOrders
                .Where(o => o.CreatedAt.Month == currentMonth && o.CreatedAt.Year == currentYear).ToList();
            var lastMonthOrders = completedOrders
                .Where(o => o.CreatedAt.Month == lastMonth && o.CreatedAt.Year == lastMonthYear).ToList();

            var monthlySalesAmount = currentMonthOrders.Sum(o => o.TotalAmount);
            var lastMonthSalesAmount = lastMonthOrders.Sum(o => o.TotalAmount);

            decimal revenueChange = 0m;
            if (lastMonthSalesAmount > 0)
                revenueChange = Math.Round(((monthlySalesAmount - lastMonthSalesAmount) / lastMonthSalesAmount) * 100, 1);
            else if (monthlySalesAmount > 0)
                revenueChange = 100m;

            return new
            {
                TotalRevenue = totalRevenue,
                TotalCogs = totalCogs,
                GrossProfit = grossProfit,
                Margin = margin,
                RevenueChange = revenueChange
            };
        }

        public async Task<IEnumerable<object>> GetRevenueChartAsync()
        {
            var result = new List<object>();
            var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            
            var currentMonth = DateTime.UtcNow.Month;
            
            for (int i = 6; i >= 0; i--)
            {
                var targetMonth = currentMonth - i;
                var year = DateTime.UtcNow.Year;
                if (targetMonth <= 0)
                {
                    targetMonth += 12;
                    year--;
                }

                var targetOrders = await _context.Orders
                    .Include(o => o.OrderDetails)
                    .Where(o => o.CreatedAt.Month == targetMonth && o.CreatedAt.Year == year && o.OrderStatus == "Delivered")
                    .ToListAsync();

                var rev = targetOrders.Sum(o => o.TotalAmount);
                var cost = targetOrders.SelectMany(o => o.OrderDetails).Sum(d => d.UnitCost * d.Quantity);

                result.Add(new
                {
                    label = months[targetMonth - 1],
                    amount = rev,
                    cost = cost
                });
            }

            return result;
        }

        public async Task<object> GetMarginDetailsAsync(int page, int pageSize)
        {
            var query = _context.Orders
                .Include(o => o.OrderDetails)
                .Where(o => o.OrderStatus == "Delivered")
                .OrderByDescending(o => o.CreatedAt);

            var totalCount = await query.CountAsync();
            var orders = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var items = orders.Select(o => {
                var cogs = o.OrderDetails.Sum(d => d.UnitCost * d.Quantity);
                var profit = o.TotalAmount - cogs;
                var margin = o.TotalAmount > 0 ? Math.Round((profit / o.TotalAmount) * 100, 1) : 0;
                return new {
                    o.Id,
                    o.OrderCode,
                    o.CustomerName,
                    o.CreatedAt,
                    Revenue = o.TotalAmount,
                    Cost = cogs,
                    Profit = profit,
                    Margin = margin
                };
            });

            return new {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task SeedDataAsync()
        {
            if (await _context.Orders.AnyAsync()) return;

            // Check if seed user already exists to avoid unique constraint violation
            if (await _context.Users.AnyAsync(u => u.Email == "admin@techretail.com")) return;

            var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@techretail.com", RoleId = 1, PasswordHash = "hash" };
            _context.Users.Add(admin);

            for (int i = 6; i >= 0; i--)
            {
                var targetMonth = DateTime.UtcNow.Month - i;
                var year = DateTime.UtcNow.Year;
                if (targetMonth <= 0)
                {
                    targetMonth += 12;
                    year--;
                }

                var baseRev = 800000m + (new Random().Next(0, 500000));

                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    OrderCode = "ORD-" + year + "-" + targetMonth + "-" + new Random().Next(1000, 9999),
                    CustomerName = "Seeded Customer",
                    TotalAmount = baseRev,
                    OrderStatus = "Delivered",
                    CreatedBy = admin.Id,
                    CreatedAt = new DateTime(year, targetMonth, 15, 0, 0, 0, DateTimeKind.Utc)
                };
                _context.Orders.Add(order);
                
                // Add some pending orders for current month
                if (i == 0)
                {
                    for (int j = 0; j < 28; j++)
                    {
                        _context.Orders.Add(new Order
                        {
                            Id = Guid.NewGuid(),
                            OrderCode = "ORD-PEND-" + new Random().Next(10000, 99999),
                            CustomerName = "Pending Customer",
                            TotalAmount = 500m,
                            OrderStatus = j % 2 == 0 ? "Pending" : "Processing",
                            CreatedBy = admin.Id,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
