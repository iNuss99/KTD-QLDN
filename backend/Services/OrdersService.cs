using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;
using Microsoft.AspNetCore.SignalR;
using techretail_api.Hubs;

namespace techretail_api.Services
{
    public interface IOrdersService
    {
        Task<PagedResult<Order>> GetOrdersAsync(int page = 1, int pageSize = 50, string? status = null, string? search = null, bool maskFinancialData = false, bool isSalesStaff = false, DateTime? fromDate = null, DateTime? toDate = null, string? createdBy = null);
        Task<Order> CreateOrderAsync(Order order);
        Task UpdateOrderStatusAsync(Guid orderId, string newStatus, string? reason, bool isAdmin, Guid currentUserId = default);
        Task DeleteOrderAsync(Guid orderId);
    }

    public class OrdersService : IOrdersService
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<OperationsHub> _hub;

        public OrdersService(AppDbContext context, IHubContext<OperationsHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        public async Task<PagedResult<Order>> GetOrdersAsync(int page = 1, int pageSize = 50, string? status = null, string? search = null, bool maskFinancialData = false, bool isSalesStaff = false, DateTime? fromDate = null, DateTime? toDate = null, string? createdBy = null)
        {
            var query = _context.Orders
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .AsQueryable();

            if (isSalesStaff)
            {
                var adminManagerIds = await _context.Users
                    .Where(u => u.Role != null && (u.Role.RoleName == "Admin" || u.Role.RoleName == "Manager"))
                    .Select(u => u.Id)
                    .ToListAsync();
                
                query = query.Where(o => !adminManagerIds.Contains(o.CreatedBy));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.OrderStatus == status);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(o => o.OrderCode.Contains(search) || o.CustomerName.Contains(search));
            }

            // Date range filters
            if (fromDate.HasValue)
            {
                var from = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
                query = query.Where(o => o.CreatedAt >= from);
            }
            if (toDate.HasValue)
            {
                var to = DateTime.SpecifyKind(toDate.Value.Date.AddDays(1), DateTimeKind.Utc);
                query = query.Where(o => o.CreatedAt < to);
            }

            // Filter by creator name (join with users)
            if (!string.IsNullOrEmpty(createdBy))
            {
                var matchingUserIds = await _context.Users
                    .Where(u => u.FullName.Contains(createdBy))
                    .Select(u => u.Id)
                    .ToListAsync();
                query = query.Where(o => matchingUserIds.Contains(o.CreatedBy));
            }

            int totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(o => o.CreatedAt)
                                   .Skip((page - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();

            if (maskFinancialData)
            {
                foreach (var order in items)
                {
                    order.SubTotal = 0;
                    order.TotalAmount = 0;
                    order.DiscountAmount = 0;
                    order.TaxAmount = 0;
                }
            }

            return new PagedResult<Order>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            order.Id = Guid.NewGuid();
            order.CreatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(order.OrderCode))
            {
                order.OrderCode = "ORD" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            }
            
            // Calculate totals
            decimal subTotal = 0;
            foreach(var detail in order.OrderDetails)
            {
                detail.Id = Guid.NewGuid();
                detail.OrderId = order.Id;
                subTotal += detail.Quantity * detail.UnitPrice;
            }
            
            order.SubTotal = subTotal;
            order.TotalAmount = subTotal + order.TaxAmount - order.DiscountAmount;

            // Start transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Orders.Add(order);

                // If created as Confirmed, deduct stock
                if (order.OrderStatus == "Confirmed" || order.OrderStatus == "Shipped" || order.OrderStatus == "Delivered")
                {
                    foreach (var detail in order.OrderDetails)
                    {
                        var product = await _context.Products.FindAsync(detail.ProductId);
                        if (product == null) throw new Exception($"Product {detail.ProductId} not found");
                        if (product.StockQuantity < detail.Quantity) throw new Exception($"Not enough stock for product {product.ProductName}");
                        
                        product.StockQuantity -= detail.Quantity;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            // Push real-time event after successful commit
            await _hub.Clients.Groups("Admin", "Manager", "Sales", "Warehouse")
                .SendAsync("NewOrderCreated", new
                {
                    orderCode = order.OrderCode,
                    customerName = order.CustomerName,
                    status = order.OrderStatus,
                    totalAmount = order.TotalAmount,
                    createdAt = order.CreatedAt
                });

            return order;
        }

        public async Task UpdateOrderStatusAsync(Guid orderId, string newStatus, string? reason, bool isAdmin, Guid currentUserId = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.Orders.Include(o => o.OrderDetails).FirstOrDefaultAsync(o => o.Id == orderId);
                if (order == null) throw new Exception("Order not found");

                var oldStatus = order.OrderStatus;
                
                // Validate state machine
                var validTransitions = new Dictionary<string, string[]>
                {
                    { "Pending", new[] { "Confirmed", "Shipped", "Delivered", "Cancelled" } },
                    { "Confirmed", new[] { "Shipped", "Delivered", "Cancelled" } },
                    { "Shipped", new[] { "Delivered", "Cancelled" } },
                    { "Delivered", new string[] { } },
                    { "Cancelled", new string[] { } }
                };

                bool isCreator = order.CreatedBy != Guid.Empty && order.CreatedBy == currentUserId;
                bool hasFullRights = isAdmin || isCreator;

                bool isValidForward = validTransitions.ContainsKey(oldStatus) && validTransitions[oldStatus].Contains(newStatus);
                if (!isValidForward)
                {
                    // Moving backwards or invalid transition
                    if (!hasFullRights) throw new Exception($"Invalid state transition from {oldStatus} to {newStatus}. Admin privileges or being the creator is required for backward transitions.");
                    if (string.IsNullOrEmpty(reason)) throw new Exception("Reason is required when moving order status backwards or performing invalid transitions.");
                }

                // Inventory deductions (Moving to a state that requires stock deduction from Pending)
                bool wasDeducted = oldStatus == "Confirmed" || oldStatus == "Shipped" || oldStatus == "Delivered";
                bool willBeDeducted = newStatus == "Confirmed" || newStatus == "Shipped" || newStatus == "Delivered";

                if (!wasDeducted && willBeDeducted)
                {
                    foreach (var detail in order.OrderDetails)
                    {
                        var product = await _context.Products.FindAsync(detail.ProductId);
                        if (product != null)
                        {
                            if (product.StockQuantity < detail.Quantity) throw new Exception($"Not enough stock for {product.ProductName}");
                            product.StockQuantity -= detail.Quantity;
                        }
                    }
                }
                else if (wasDeducted && !willBeDeducted) // Inventory restorations (e.g. to Pending or Cancelled)
                {
                    foreach (var detail in order.OrderDetails)
                    {
                        var product = await _context.Products.FindAsync(detail.ProductId);
                        if (product != null)
                        {
                            product.StockQuantity += detail.Quantity;
                        }
                    }
                }

                order.OrderStatus = newStatus;
                await _context.SaveChangesAsync();

                // Push real-time event
                await _hub.Clients.Groups("Admin", "Manager", "Sales", "Warehouse")
                    .SendAsync("OrderStatusChanged", new
                    {
                        orderId,
                        orderCode = order.OrderCode,
                        oldStatus,
                        newStatus,
                        updatedAt = DateTime.UtcNow
                    });

                // Generate SystemLog if needed
                if (!isValidForward && isAdmin)
                {
                    _context.SystemLogs.Add(new SystemLog
                    {
                        Id = Guid.NewGuid(),
                        ActionType = "AdminOverrideStatus",
                        UserId = Guid.Empty, // Controller will need to set this properly if we had access to current user, but context here is missing it unless passed. 
                        // To keep it simple, we just log the reason in old/new values.
                        TableName = "Orders",
                        OldValues = oldStatus,
                        NewValues = $"{newStatus} (Reason: {reason})",
                        SeverityLevel = "High",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task DeleteOrderAsync(Guid orderId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _context.Orders.Include(o => o.OrderDetails).FirstOrDefaultAsync(o => o.Id == orderId);
                if (order == null) throw new Exception("Order not found");

                // If order was deducted, restore inventory
                if (order.OrderStatus == "Confirmed" || order.OrderStatus == "Shipped" || order.OrderStatus == "Delivered")
                {
                    foreach (var detail in order.OrderDetails)
                    {
                        var product = await _context.Products.FindAsync(detail.ProductId);
                        if (product != null)
                        {
                            product.StockQuantity += detail.Quantity;
                        }
                    }
                }

                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
