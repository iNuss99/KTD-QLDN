using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;
using System;
using System.Linq;
using System.Collections.Generic;

namespace techretail_api.Infrastructure.Database.Seeders
{
    public static class StockAdjustmentSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            if (dbContext.StockAdjustments.Count() < 5)
            {
                var products = dbContext.Products.ToList();
                var adminUser = dbContext.Users.FirstOrDefault(u => u.Email == "admin@ktd.com") ?? dbContext.Users.FirstOrDefault();

                if (products.Count == 0 || adminUser == null) return;

                var records = new List<StockAdjustment>();
                var random = new Random();
                var reasons = new[] { "Nhập hàng mới", "Kiểm kê định kỳ", "Hàng lỗi trả về", "Xuất hao hụt", "Hàng tặng khách" };

                for (int i = 0; i < 20; i++)
                {
                    var product = products[random.Next(products.Count)];
                    int oldQty = product.StockQuantity;
                    // change by -10 to +30
                    int change = random.Next(-10, 31);
                    if (change == 0) change = 10;

                    int newQty = Math.Max(0, oldQty + change);

                    records.Add(new StockAdjustment
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        AdjustedBy = adminUser.Id,
                        OldQuantity = oldQty,
                        NewQuantity = newQty,
                        Reason = change > 0 ? "Nhập hàng mới" : reasons[random.Next(1, reasons.Length)],
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60))
                    });

                    product.StockQuantity = newQty;
                }

                dbContext.StockAdjustments.AddRange(records);
                dbContext.SaveChanges();
            }
        }
    }
}
