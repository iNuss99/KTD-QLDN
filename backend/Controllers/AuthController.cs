using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using techretail_api.Services;
using techretail_api.Core.Models;
using techretail_api.Repositories;

namespace techretail_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;
        private readonly IRepository<Role> _roleRepository;

        public AuthController(IAuthService authService, IUserService userService, IRepository<Role> roleRepository)
        {
            _authService = authService;
            _userService = userService;
            _roleRepository = roleRepository;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            string? token;
            try
            {
                token = await _authService.LoginAsync(request.Email, request.Password);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }

            if (token == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user == null) return Unauthorized();

            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            var actualRoleName = role?.RoleName ?? "Sales Staff";

            return Ok(new { 
                token, 
                user = new { 
                    id = user.Id, 
                    email = user.Email, 
                    fullName = user.FullName, 
                    role = actualRoleName, 
                    avatarUrl = user.AvatarUrl,
                    isFirstLogin = user.IsFirstLogin 
                } 
            });
        }

        [HttpPost("change-password")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var success = await _userService.ChangePasswordAsync(userId, request.OldPassword, request.NewPassword);
            if (!success) return BadRequest(new { message = "Invalid old password." });

            return Ok(new { message = "Password changed successfully" });
        }

        [HttpPut("profile")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null) return NotFound();

            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            bool isAdminOrManager = role?.RoleName == "Admin" || role?.RoleName == "Manager";

            if (isAdminOrManager)
            {
                if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName;
                if (!string.IsNullOrWhiteSpace(request.Department)) user.Department = request.Department;
            }

            if (request.AvatarUrl != null) // allow empty string to clear avatar
            {
                user.AvatarUrl = request.AvatarUrl;
            }

            await _userService.UpdateUserAsync(user);

            return Ok(new { 
                message = "Profile updated successfully",
                user = new {
                    id = user.Id, 
                    email = user.Email, 
                    fullName = user.FullName, 
                    role = role?.RoleName ?? "Sales Staff", 
                    avatarUrl = user.AvatarUrl,
                    isFirstLogin = user.IsFirstLogin 
                }
            });
        }

        /// <summary>
        /// Validate token: checks if user from JWT still exists in DB.
        /// Returns 200 with user info if valid, 401 if user not found (stale token).
        /// </summary>
        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> Me()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Invalid token: cannot parse user ID." });

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "Token is stale: user no longer exists in database. Please log in again." });

            if (!user.IsActive)
                return Unauthorized(new { message = "Account has been deactivated. Please contact administrator." });

            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            return Ok(new {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                role = role?.RoleName ?? "Sales Staff",
                avatarUrl = user.AvatarUrl,
                isFirstLogin = user.IsFirstLogin
            });
        }
    }

    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Department { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
