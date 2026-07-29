using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;
using techretail_api.Repositories;

namespace techretail_api.Core.Attributes
{
    public class RequiresPermissionAttribute : TypeFilterAttribute
    {
        public RequiresPermissionAttribute(string permissionKey) : base(typeof(RequiresPermissionFilter))
        {
            Arguments = new object[] { permissionKey };
        }
    }

    public class RequiresPermissionFilter : IAsyncActionFilter
    {
        private readonly string _permissionKey;
        private readonly AppDbContext _db;
        private readonly IRepository<Role> _roleRepository;
        private readonly IMemoryCache _cache;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

        public RequiresPermissionFilter(string permissionKey, AppDbContext db, IRepository<Role> roleRepository, IMemoryCache cache)
        {
            _permissionKey = permissionKey;
            _db = db;
            _roleRepository = roleRepository;
            _cache = cache;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var userIdStr = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                context.Result = new ObjectResult(new { message = "Bạn chưa đăng nhập." }) { StatusCode = 401 };
                return;
            }

            // Cache user's roleId to avoid repeated DB lookups
            var roleId = await _cache.GetOrCreateAsync($"user_role_{userId}", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == userId);
                return u?.RoleId ?? 0;
            });

            if (roleId == 0)
            {
                context.Result = new ObjectResult(new { message = "Người dùng không tồn tại." }) { StatusCode = 401 };
                return;
            }

            // Cache role name
            var roleName = await _cache.GetOrCreateAsync($"role_name_{roleId}", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                var r = await _roleRepository.GetByIdAsync(roleId);
                return r?.RoleName ?? string.Empty;
            });

            if (string.IsNullOrEmpty(roleName))
            {
                context.Result = new ObjectResult(new { message = "Vai trò không hợp lệ." }) { StatusCode = 403 };
                return;
            }

            // Always allow Admin full access
            if (roleName == "Admin")
            {
                await next();
                return;
            }

            // Cache permission check per role+permission key combination
            var cacheKey = $"perm_{roleName}_{_permissionKey}";
            var hasPerm = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                return await _db.RolePermissions
                    .AsNoTracking()
                    .AnyAsync(rp => rp.RoleName == roleName && rp.PermissionKey == _permissionKey && rp.IsGranted);
            });

            if (!hasPerm)
            {
                context.Result = new ObjectResult(new { message = "Bạn không có quyền thực hiện chức năng này." }) { StatusCode = 403 };
                return;
            }

            await next();
        }
    }
}
