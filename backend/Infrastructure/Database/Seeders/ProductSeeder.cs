using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;

namespace techretail_api.Infrastructure.Database.Seeders
{
    public static class ProductSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            if (!dbContext.Products.Any(p => p.Id == Guid.Parse("10000000-0000-0000-0000-000000000001")))
            {
                dbContext.Products.AddRange(
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), SKU = "LAP-MAC-14", ProductName = "MacBook Pro 14\" M3", CostPrice = 35000000, SellingPrice = 45000000, StockQuantity = 50 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), SKU = "PHO-IPH-15", ProductName = "iPhone 15 Pro Max", CostPrice = 24000000, SellingPrice = 29000000, StockQuantity = 100 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), SKU = "AUD-SON-XM5", ProductName = "Sony WH-1000XM5", CostPrice = 6000000, SellingPrice = 8500000, StockQuantity = 30 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), SKU = "ACC-MOU-MX3", ProductName = "Logitech MX Master 3S", CostPrice = 1500000, SellingPrice = 2500000, StockQuantity = 80 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), SKU = "TAB-IPAD-11", ProductName = "iPad Pro 11\" M4", CostPrice = 18000000, SellingPrice = 23000000, StockQuantity = 40 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), SKU = "PHO-GAL-S24", ProductName = "Samsung Galaxy S24 Ultra", CostPrice = 22000000, SellingPrice = 28000000, StockQuantity = 60 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), SKU = "WAT-APP-S9", ProductName = "Apple Watch Series 9", CostPrice = 7000000, SellingPrice = 10000000, StockQuantity = 70 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), SKU = "KEY-KCH-Q1", ProductName = "Bàn phím cơ Keychron Q1", CostPrice = 2500000, SellingPrice = 4000000, StockQuantity = 25 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), SKU = "TV-LG-C3-55", ProductName = "LG OLED TV 55 inch C3", CostPrice = 25000000, SellingPrice = 35000000, StockQuantity = 15 },
                    new Product { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), SKU = "AUD-APP-AP2", ProductName = "AirPods Pro 2", CostPrice = 4500000, SellingPrice = 6000000, StockQuantity = 120 }
                );
                dbContext.SaveChanges();
            }

            // Auto-update existing low prices for VND scale
            dbContext.Database.ExecuteSqlRaw("UPDATE \"Products\" SET \"CostPrice\" = \"CostPrice\" * 20000, \"SellingPrice\" = \"SellingPrice\" * 20000 WHERE \"CostPrice\" < 10000;");
            dbContext.Database.ExecuteSqlRaw("UPDATE \"Orders\" SET \"TotalAmount\" = \"TotalAmount\" * 20000 WHERE \"TotalAmount\" < 100000;");
            dbContext.Database.ExecuteSqlRaw("UPDATE \"OrderDetails\" SET \"UnitPrice\" = \"UnitPrice\" * 20000, \"UnitCost\" = \"UnitCost\" * 20000 WHERE \"UnitPrice\" < 10000;");
        }
    }
}
