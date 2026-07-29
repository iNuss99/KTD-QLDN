using Microsoft.EntityFrameworkCore;
using techretail_api.Core.Models;

namespace techretail_api.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<SystemLog> SystemLogs { get; set; }
        public DbSet<StockAdjustment> StockAdjustments { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<PayrollRecord> PayrollRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Role>().HasIndex(r => r.RoleName).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<Product>().HasIndex(p => p.SKU).IsUnique();
            modelBuilder.Entity<Order>().HasIndex(o => o.OrderCode).IsUnique();
            modelBuilder.Entity<RolePermission>()
                .HasIndex(rp => new { rp.PermissionKey, rp.RoleName })
                .IsUnique();

            // Performance indexes — filter orders by status+date (Dashboard, GetOrders)
            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.OrderStatus, o.CreatedAt })
                .HasDatabaseName("IX_Orders_Status_CreatedAt");

            // Composite index for creator filter
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.CreatedBy)
                .HasDatabaseName("IX_Orders_CreatedBy");

            // UNIQUE index on (UserId, Date) — prevents duplicate check-in (race condition fix)
            modelBuilder.Entity<AttendanceRecord>()
                .HasIndex(a => new { a.UserId, a.Date })
                .IsUnique()
                .HasDatabaseName("IX_Attendance_User_Date");

            // UNIQUE index on payroll — prevents duplicate payroll per month
            modelBuilder.Entity<PayrollRecord>()
                .HasIndex(p => new { p.UserId, p.Month, p.Year })
                .IsUnique()
                .HasDatabaseName("IX_Payroll_User_Month_Year");

            // RefreshToken lookup by token string
            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token)
                .IsUnique()
                .HasDatabaseName("IX_RefreshTokens_Token");

            // SystemLog dashboard query (recent activities)
            modelBuilder.Entity<SystemLog>()
                .HasIndex(l => l.CreatedAt)
                .HasDatabaseName("IX_SystemLogs_CreatedAt");


            // Decimal precision
            modelBuilder.Entity<Product>().Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Product>().Property(p => p.SellingPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>().Property(o => o.SubTotal).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>().Property(o => o.DiscountAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>().Property(o => o.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<OrderDetail>().Property(od => od.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<OrderDetail>().Property(od => od.UnitCost).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Expense>().Property(e => e.Amount).HasColumnType("decimal(18,2)");

            // Concurrency Token
            modelBuilder.Entity<Product>().Property(p => p.RowVersion).IsRowVersion();
        }
    }
}
