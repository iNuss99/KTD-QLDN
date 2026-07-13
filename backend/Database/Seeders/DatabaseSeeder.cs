using Microsoft.EntityFrameworkCore;
using techretail_api.Data;

namespace techretail_api.Database.Seeders
{
    /// <summary>
    /// Orchestrator for all database seeders.
    /// Call DatabaseSeeder.SeedAll() from Program.cs to run all seeders in order.
    /// </summary>
    public static class DatabaseSeeder
    {
        public static void SeedAll(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            
            // Ensure database is migrated
            dbContext.Database.Migrate();

            // Run seeders in dependency order
            RoleSeeder.Seed(dbContext);
            UserSeeder.Seed(dbContext);
            ProductSeeder.Seed(dbContext);
            ExpenseSeeder.Seed(dbContext);
        }
    }
}
