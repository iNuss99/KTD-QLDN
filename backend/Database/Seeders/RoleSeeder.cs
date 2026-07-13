using Microsoft.EntityFrameworkCore;
using techretail_api.Data;

namespace techretail_api.Database.Seeders
{
    public static class RoleSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            var rolesToEnsure = new[]
            {
                "INSERT INTO \"Roles\" (\"Id\", \"RoleName\", \"Description\", \"HierarchyLevel\") VALUES (1, 'Admin', 'Administrator', 1) ON CONFLICT (\"Id\") DO UPDATE SET \"RoleName\" = EXCLUDED.\"RoleName\", \"HierarchyLevel\" = EXCLUDED.\"HierarchyLevel\";",
                "INSERT INTO \"Roles\" (\"Id\", \"RoleName\", \"Description\", \"HierarchyLevel\") VALUES (2, 'Manager', 'Store Manager', 2) ON CONFLICT (\"Id\") DO UPDATE SET \"RoleName\" = EXCLUDED.\"RoleName\", \"HierarchyLevel\" = EXCLUDED.\"HierarchyLevel\";",
                "INSERT INTO \"Roles\" (\"Id\", \"RoleName\", \"Description\", \"HierarchyLevel\") VALUES (3, 'Accountant', 'Accountant', 3) ON CONFLICT (\"Id\") DO UPDATE SET \"RoleName\" = EXCLUDED.\"RoleName\", \"HierarchyLevel\" = EXCLUDED.\"HierarchyLevel\";",
                "INSERT INTO \"Roles\" (\"Id\", \"RoleName\", \"Description\", \"HierarchyLevel\") VALUES (4, 'Sales Staff', 'Sales/CSKH', 3) ON CONFLICT (\"Id\") DO UPDATE SET \"RoleName\" = EXCLUDED.\"RoleName\", \"HierarchyLevel\" = EXCLUDED.\"HierarchyLevel\";",
                "INSERT INTO \"Roles\" (\"Id\", \"RoleName\", \"Description\", \"HierarchyLevel\") VALUES (5, 'Warehouse Staff', 'Warehouse Operator', 3) ON CONFLICT (\"Id\") DO UPDATE SET \"RoleName\" = EXCLUDED.\"RoleName\", \"HierarchyLevel\" = EXCLUDED.\"HierarchyLevel\";"
            };

            foreach (var sql in rolesToEnsure)
            {
                dbContext.Database.ExecuteSqlRaw(sql);
            }

            // Delete obsolete roles > 5
            dbContext.Database.ExecuteSqlRaw("DELETE FROM \"Roles\" WHERE \"Id\" > 5;");

        }
    }
}
