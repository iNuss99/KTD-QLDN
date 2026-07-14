using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
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

        public RequiresPermissionFilter(string permissionKey, AppDbContext db, IRepository<Role> roleRepository)
        {
            _permissionKey = permissionKey;
            _db = db;
            _roleRepository = roleRepository;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var userIdStr = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                context.Result = new ObjectResult(new { message = "Bạn chưa đăng nhập." }) { StatusCode = 401 };
                return;
            }

            var user = await _db.Users.FindAsync(userId);
            if (user == null)
            {
                context.Result = new ObjectResult(new { message = "Người dùng không tồn tại." }) { StatusCode = 401 };
                return;
            }

            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            if (role == null)
            {
                context.Result = new ObjectResult(new { message = "Vai trò không hợp lệ." }) { StatusCode = 403 };
                return;
            }

            // Always allow Admin role full access to everything as a fallback
            if (role.RoleName == "Admin")
            {
                await next();
                return;
            }

            var hasPerm = await _db.RolePermissions
                .AnyAsync(rp => rp.RoleName == role.RoleName && rp.PermissionKey == _permissionKey && rp.IsGranted);

            if (!hasPerm)
            {
                context.Result = new ObjectResult(new { message = "Bạn không có quyền thực hiện chức năng này." }) { StatusCode = 403 };
                return;
            }

            await next();
        }
    }
}
