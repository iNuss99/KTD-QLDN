using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using techretail_api.Data;
using techretail_api.Models;
using techretail_api.Repositories;

namespace techretail_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IRepository<Role> _roleRepository;

        public PermissionsController(AppDbContext db, IRepository<Role> roleRepository)
        {
            _db = db;
            _roleRepository = roleRepository;
        }

        private async Task<bool> IsAdminOrManager()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return false;
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return false;
            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            return role?.RoleName == "Admin" || role?.RoleName == "Manager";
        }

        /// <summary>
        /// Trả về toàn bộ ma trận quyền dạng phẳng (list of {permissionKey, roleName, isGranted}).
        /// Nếu DB chưa có record nào, trả về cấu hình mặc định từ hardcode.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetPermissions()
        {
            var records = await _db.RolePermissions.ToListAsync();

            // Nếu DB chưa có dữ liệu → seed mặc định
            if (!records.Any())
            {
                var defaults = GetDefaultPermissions();
                _db.RolePermissions.AddRange(defaults);
                await _db.SaveChangesAsync();
                records = defaults;
            }

            var result = records.Select(r => new
            {
                permissionKey = r.PermissionKey,
                roleName = r.RoleName,
                isGranted = r.IsGranted
            });

            return Ok(result);
        }

        /// <summary>
        /// Lưu ma trận quyền. Chỉ Admin hoặc Manager mới được phép gọi.
        /// Body: [{ permissionKey, roleName, isGranted }]
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpdatePermissions([FromBody] List<PermissionUpdateItem> items)
        {
            if (!await IsAdminOrManager())
                return StatusCode(403, new { message = "Chỉ Admin hoặc Manager mới có quyền thay đổi ma trận phân quyền." });

            if (items == null || !items.Any())
                return BadRequest(new { message = "Danh sách quyền không được rỗng." });

            // Upsert từng item
            foreach (var item in items)
            {
                var existing = await _db.RolePermissions
                    .FirstOrDefaultAsync(rp => rp.PermissionKey == item.PermissionKey && rp.RoleName == item.RoleName);

                if (existing != null)
                {
                    existing.IsGranted = item.IsGranted;
                }
                else
                {
                    _db.RolePermissions.Add(new RolePermission
                    {
                        PermissionKey = item.PermissionKey,
                        RoleName = item.RoleName,
                        IsGranted = item.IsGranted
                    });
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Ma trận quyền đã được lưu thành công." });
        }

        private static List<RolePermission> GetDefaultPermissions()
        {
            var roles = new[] { "Admin", "Manager", "Accountant", "Sales Staff", "Warehouse Staff" };
            var defaults = new Dictionary<string, Dictionary<string, bool>>
            {
                ["perm-1"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=true, ["Sales Staff"]=false, ["Warehouse Staff"]=false },
                ["perm-2"] = new() { ["Admin"]=true, ["Manager"]=false, ["Accountant"]=true, ["Sales Staff"]=false, ["Warehouse Staff"]=false },
                ["perm-3"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=true, ["Sales Staff"]=false, ["Warehouse Staff"]=false },
                ["perm-4"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=false, ["Sales Staff"]=false, ["Warehouse Staff"]=false },
                ["perm-5"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=false, ["Sales Staff"]=false, ["Warehouse Staff"]=true },
                ["perm-6"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=false, ["Sales Staff"]=false, ["Warehouse Staff"]=true },
                ["perm-7"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=true, ["Sales Staff"]=false, ["Warehouse Staff"]=false },
                ["perm-8"] = new() { ["Admin"]=true, ["Manager"]=true, ["Accountant"]=false, ["Sales Staff"]=false, ["Warehouse Staff"]=false },
            };

            var result = new List<RolePermission>();
            foreach (var (permKey, roleMap) in defaults)
                foreach (var (roleName, isGranted) in roleMap)
                    result.Add(new RolePermission { PermissionKey = permKey, RoleName = roleName, IsGranted = isGranted });

            return result;
        }
    }

    public class PermissionUpdateItem
    {
        public string PermissionKey { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public bool IsGranted { get; set; }
    }
}
