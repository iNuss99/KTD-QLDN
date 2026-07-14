using Microsoft.EntityFrameworkCore;
using techretail_api.Models;

namespace techretail_api.Data
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
