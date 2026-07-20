using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;

namespace techretail_api.Infrastructure.Database.Seeders
{
    public static class UserSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            var adminUser = dbContext.Users.FirstOrDefault(u => u.Email == "admin@techretail.local" || u.Email == "admin@ktd.com");
            if (adminUser == null)
            {
                var adminRole = dbContext.Roles.FirstOrDefault(r => r.RoleName == "Admin");
                if (adminRole != null)
                {
                    dbContext.Users.Add(new User
                    {
                        Email = "admin@ktd.com",
                        FullName = "System Admin",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@12345"),
                        IsActive = true,
                        RoleId = adminRole.Id,
                        Department = "Ban Giám đốc",
                        JobTitle = "Giám đốc / CEO"
                    });
                    dbContext.SaveChanges();
                }
            }
            // else if (adminUser.Email == "admin@techretail.local")
            // {
            //     try {
            //         adminUser.Email = "admin@ktd.com";
            //         dbContext.SaveChanges();
            //     } catch {}
            // }
        }
    }
}
