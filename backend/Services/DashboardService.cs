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
        Task<IEnumerable<object>> GetTopProductsAsync(int limit = 5);
        Task<object> GetOrderStatusDistributionAsync();
        Task<IEnumerable<object>> GetSalesTrendAsync(int days = 30);
        Task<IEnumerable<object>> GetRecentActivitiesAsync(int limit = 5);
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
            var now = DateTime.UtcNow;
            var currentMonth = now.Month;
            var currentYear = now.Year;
            var lastMonth = currentMonth == 1 ? 12 : currentMonth - 1;
            var lastMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;

            // All aggregation happens in PostgreSQL — zero rows transferred to C#
            var revenue = await _context.Orders
                .Where(o => o.OrderStatus == "Delivered")
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    TotalRevenue = g.Sum(o => o.TotalAmount),
                    CurrentMonthRev = g.Where(o => o.CreatedAt.Month == currentMonth && o.CreatedAt.Year == currentYear)
                                       .Sum(o => o.TotalAmount),
                    LastMonthRev = g.Where(o => o.CreatedAt.Month == lastMonth && o.CreatedAt.Year == lastMonthYear)
                                       .Sum(o => o.TotalAmount)
                })
                .FirstOrDefaultAsync();

            // COGS requires joining OrderDetails — single query with SELECT SUM
            var totalCogs = await _context.OrderDetails
                .Where(od => od.Order!.OrderStatus == "Delivered")
                .SumAsync(od => od.UnitCost * od.Quantity);

            var totalRevenue = revenue?.TotalRevenue ?? 0;
            var grossProfit = totalRevenue - totalCogs;
            var margin = totalRevenue > 0 ? Math.Round((grossProfit / totalRevenue) * 100, 1) : 0;

            var monthlySales = revenue?.CurrentMonthRev ?? 0;
            var lastMonthSales = revenue?.LastMonthRev ?? 0;
            decimal revenueChange = 0m;
            if (lastMonthSales > 0)
                revenueChange = Math.Round(((monthlySales - lastMonthSales) / lastMonthSales) * 100, 1);
            else if (monthlySales > 0)
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
            var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            var sixMonthsAgo = DateTime.UtcNow.Date.AddMonths(-6);

            // Single GROUP BY query instead of 7 round-trips
            var dbData = await _context.Orders
                .AsNoTracking()
                .Where(o => o.OrderStatus == "Delivered" && o.CreatedAt >= sixMonthsAgo)
                .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Revenue = g.Sum(o => o.TotalAmount),
                    Cost = (decimal?)g.SelectMany(o => o.OrderDetails).Sum(d => d.UnitCost * d.Quantity) ?? 0
                })
                .ToListAsync();

            // Build last-7-month result (fill missing months with 0)
            var result = new List<object>();
            for (int i = 6; i >= 0; i--)
            {
                var target = DateTime.UtcNow.AddMonths(-i);
                var entry = dbData.FirstOrDefault(d => d.Year == target.Year && d.Month == target.Month);
                result.Add(new
                {
                    label = months[target.Month - 1],
                    amount = entry?.Revenue ?? 0m,
                    cost = entry?.Cost ?? 0m
                });
            }
            return result;
        }

        public async Task<object> GetMarginDetailsAsync(int page, int pageSize)
        {
            var query = _context.Orders
                .AsNoTracking()
                .Include(o => o.OrderDetails)
                .Where(o => o.OrderStatus == "Delivered")
                .OrderByDescending(o => o.CreatedAt);

            var totalCount = await query.CountAsync();
            var orders = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var items = orders.Select(o =>
            {
                var cogs = o.OrderDetails.Sum(d => d.UnitCost * d.Quantity);
                var profit = o.TotalAmount - cogs;
                var margin = o.TotalAmount > 0 ? Math.Round((profit / o.TotalAmount) * 100, 1) : 0;
                return new
                {
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

            return new
            {
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
            if (await _context.Users.AnyAsync(u => u.Email == "admin@ktd.local")) return;

            var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@ktd.local", RoleId = 1, PasswordHash = "hash" };
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
        public async Task<IEnumerable<object>> GetTopProductsAsync(int limit = 5)
        {
            var result = await _context.OrderDetails
                .AsNoTracking()
                .Include(od => od.Product)
                .Where(od => od.Product != null && !od.Product.IsDeleted)
                .GroupBy(od => new { od.ProductId, od.Product!.ProductName, od.Product.SKU })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    SKU = g.Key.SKU,
                    TotalQuantity = g.Sum(x => x.Quantity),
                    TotalRevenue = g.Sum(x => x.Quantity * x.UnitPrice)
                })
                .OrderByDescending(x => x.TotalQuantity)
                .Take(limit)
                .ToListAsync();

            return result.Cast<object>();
        }

        public async Task<object> GetOrderStatusDistributionAsync()
        {
            var distribution = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => o.OrderStatus)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            return new
            {
                Pending = distribution.FirstOrDefault(d => d.Status == "Pending")?.Count ?? 0,
                Confirmed = distribution.FirstOrDefault(d => d.Status == "Confirmed")?.Count ?? 0,
                Shipped = distribution.FirstOrDefault(d => d.Status == "Shipped")?.Count ?? 0,
                Delivered = distribution.FirstOrDefault(d => d.Status == "Delivered")?.Count ?? 0,
                Cancelled = distribution.FirstOrDefault(d => d.Status == "Cancelled")?.Count ?? 0,
            };
        }

        public async Task<IEnumerable<object>> GetSalesTrendAsync(int days = 30)
        {
            var startDate = DateTime.UtcNow.Date.AddDays(-days + 1);
            var orders = await _context.Orders
                .AsNoTracking()
                .Where(o => o.CreatedAt >= startDate && (o.OrderStatus == "Confirmed" || o.OrderStatus == "Shipped" || o.OrderStatus == "Delivered"))
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Revenue = g.Sum(x => x.TotalAmount), Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Fill missing days with 0
            var result = new List<object>();
            for (int i = 0; i < days; i++)
            {
                var date = startDate.AddDays(i);
                var entry = orders.FirstOrDefault(o => o.Date == date);
                result.Add(new
                {
                    date = date.ToString("dd/MM"),
                    revenue = entry?.Revenue ?? 0m,
                    count = entry?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<IEnumerable<object>> GetRecentActivitiesAsync(int limit = 5)
        {
            var logs = await _context.SystemLogs
                .AsNoTracking()
                .Include(l => l.User)
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return logs.Select(l => new
            {
                id = l.Id.ToString(),
                type = MapSeverityToType(l.SeverityLevel),
                title = l.ActionType,
                description = $"{l.User?.FullName ?? "Hệ thống"} đã thao tác trên {l.TableName}.",
                createdAt = l.CreatedAt,
                badgeText = MapSeverityToBadge(l.SeverityLevel)
            });
        }

        private string MapSeverityToType(string severity)
        {
            return severity switch
            {
                "Warning" => "warning",
                "Error" => "critical",
                "Critical" => "critical",
                _ => "info"
            };
        }

        private string? MapSeverityToBadge(string severity)
        {
            return severity switch
            {
                "Warning" => "Cảnh báo",
                "Error" => "Lỗi",
                "Critical" => "Nghiêm trọng",
                _ => null
            };
        }
    }
}
