using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;
using System;
using System.Linq;
using System.Collections.Generic;

namespace techretail_api.Infrastructure.Database.Seeders
{
    public static class OrderSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            if (dbContext.Orders.Count() < 100)
            {
                var random = new Random();
                var products = dbContext.Products.ToList();
                var adminUser = dbContext.Users.FirstOrDefault(u => u.Email == "admin@ktd.com") ?? dbContext.Users.FirstOrDefault();

                if (products.Count == 0 || adminUser == null) return;

                var customers = new[] { "Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E", "Đặng Thị F", "Bùi Văn G", "Đỗ Thị H", "Hồ Văn I", "Ngô Thị K", "Công ty TNHH ABC", "Cửa hàng XYZ", "Đại lý Cấp 1 HN", "Siêu thị Minh Hoa" };
                var statuses = new[] { "Pending", "Processing", "Shipped", "Delivered", "Delivered", "Delivered", "Cancelled", "Refunded" };

                var newOrders = new List<Order>();

                for (int i = 0; i < 100; i++)
                {
                    var orderDate = DateTime.UtcNow.AddDays(-random.Next(1, 90)).AddHours(-random.Next(1, 24));
                    var customer = customers[random.Next(customers.Length)];
                    var status = statuses[random.Next(statuses.Length)];

                    var order = new Order
                    {
                        Id = Guid.NewGuid(),
                        OrderCode = $"ORD-{orderDate:yyyyMM}-{random.Next(1000, 9999)}",
                        CustomerName = customer,
                        OrderStatus = status,
                        CreatedBy = adminUser.Id,
                        CreatedAt = orderDate,
                        OrderDetails = new List<OrderDetail>()
                    };

                    int numItems = random.Next(1, 5);
                    decimal subTotal = 0;

                    for (int j = 0; j < numItems; j++)
                    {
                        var product = products[random.Next(products.Count)];
                        int quantity = random.Next(1, 4);

                        // Prevent duplicate products in the same order
                        if (order.OrderDetails.Any(d => d.ProductId == product.Id)) continue;

                        var detail = new OrderDetail
                        {
                            Id = Guid.NewGuid(),
                            ProductId = product.Id,
                            Quantity = quantity,
                            UnitPrice = product.SellingPrice,
                            UnitCost = product.CostPrice
                        };
                        order.OrderDetails.Add(detail);
                        subTotal += detail.UnitPrice * detail.Quantity;
                    }

                    if (order.OrderDetails.Count == 0) continue;

                    order.SubTotal = subTotal;
                    order.DiscountAmount = random.Next(0, 100) > 70 ? subTotal * (decimal)(random.Next(5, 15) / 100.0) : 0;
                    order.TaxAmount = (subTotal - order.DiscountAmount) * 0.1m; // 10% VAT
                    order.TotalAmount = subTotal - order.DiscountAmount + order.TaxAmount;

                    newOrders.Add(order);
                }

                dbContext.Orders.AddRange(newOrders);
                dbContext.SaveChanges();
            }
        }
    }
}
