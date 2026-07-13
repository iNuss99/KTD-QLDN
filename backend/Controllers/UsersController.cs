using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using techretail_api.Models;
using techretail_api.Services;

using System.Security.Claims;
using techretail_api.Repositories;

namespace techretail_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require Authentication
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IRepository<Role> _roleRepository;

        public UsersController(IUserService userService, IRepository<Role> roleRepository)
        {
            _userService = userService;
            _roleRepository = roleRepository;
        }

        private async Task<bool> CheckRoleHierarchy(int targetRoleId, string? targetDepartment)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(currentUserIdStr, out var currentUserId)) return false;

            var currentUser = await _userService.GetUserByIdAsync(currentUserId);
            if (currentUser == null) return false;

            var currentUserRole = await _roleRepository.GetByIdAsync(currentUser.RoleId);
            var targetRole = await _roleRepository.GetByIdAsync(targetRoleId);

            if (currentUserRole == null || targetRole == null) return false;

            // Cannot create/modify a user with a role equal to or higher in the hierarchy (lower HierarchyLevel number = higher rank)
            // Exception: Admin can manage other Admins
            if (currentUserRole.RoleName == "Admin" && targetRole.RoleName == "Admin")
            {
                // Allowed
            }
            else if (currentUserRole.HierarchyLevel >= targetRole.HierarchyLevel) 
            {
                return false;
            }

            // Manager department restrictions (PRD 2.1)
            // Manager in "Ban Giám đốc" can manage ALL subordinate (level-3) roles across all departments.
            // Manager in a specific department can only manage their own department's staff.
            if (currentUserRole.RoleName == "Manager")
            {
                if (currentUser.Department == "Ban Giám đốc")
                {
                    // General manager: can create any level-3 employee in any department
                }
                else if (currentUser.Department == "Kinh doanh (Sales/CSKH)")
                {
                    if (targetRole.RoleName != "Sales Staff" || targetDepartment != "Kinh doanh (Sales/CSKH)")
                        return false;
                }
                else if (currentUser.Department == "Kho vận")
                {
                    if (targetRole.RoleName != "Warehouse Staff" || targetDepartment != "Kho vận")
                        return false;
                }
                else if (currentUser.Department == "Kế toán")
                {
                    if (targetRole.RoleName != "Accountant" || targetDepartment != "Kế toán")
                        return false;
                }
                else
                {
                    // Unknown department for manager - allow managing any level-3 role
                }
            }

            return true;
        }

        private bool IsSelf(Guid targetUserId)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(currentUserIdStr, out var currentUserId)) return false;
            return currentUserId == targetUserId;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<User>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] int? role = null, [FromQuery] string? department = null, [FromQuery] bool? isActive = null)
        {
            if (pageSize > 100) pageSize = 100;
            
            string? departmentFilter = department;
            int? roleIdFilter = role;

            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(currentUserIdStr, out var currentUserId))
            {
                var currentUser = await _userService.GetUserByIdAsync(currentUserId);
                if (currentUser != null)
                {
                    var currentUserRole = await _roleRepository.GetByIdAsync(currentUser.RoleId);
                    if (currentUserRole?.RoleName == "Manager")
                    {
                        if (currentUser.Department == "Kinh doanh (Sales/CSKH)")
                        {
                            // Sales Manager: only sees Sales Staff in their dept
                            departmentFilter = currentUser.Department;
                        }
                        else if (currentUser.Department == "Kho vận")
                        {
                            // Warehouse Manager: only sees Warehouse Staff in their dept
                            departmentFilter = currentUser.Department;
                        }
                        else if (currentUser.Department == "Kế toán")
                        {
                            // Accounting Manager: only sees Accountants in their dept
                            departmentFilter = currentUser.Department;
                        }
                        else
                        {
                            // General Manager (Ban Giám đốc) or unspecified dept:
                            // Can see ALL level-3 subordinate employees across all departments.
                            // Do NOT apply any department filter – return all subordinates.
                            // Optionally, exclude other Admins/Managers from the list.
                            roleIdFilter = null; // remove role filter, show all
                            departmentFilter = null; // no dept restriction
                        }
                    }
                }
            }

            var users = await _userService.GetAllUsersAsync(page, pageSize, departmentFilter, roleIdFilter, isActive);
            return Ok(users);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<object>> PostUser([FromBody] CreateUserRequest request)
        {
            if (!await CheckRoleHierarchy(request.RoleId, request.Department))
            {
                return StatusCode(403, new { message = "You do not have permission to assign this role." });
            }

            var existingUser = await _userService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "Email already exists" });
            }
            try
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = request.FullName,
                    Email = request.Email,
                    RoleId = request.RoleId,
                    Department = request.Department,
                    Salary = request.Salary ?? 0
                };

                var result = await _userService.CreateUserAsync(user);
                return CreatedAtAction(nameof(GetUsers), new { id = result.User.Id }, new { 
                    User = result.User,
                    GeneratedPassword = result.GeneratedPassword 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error: " + ex.Message, details = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null) return NotFound();

            // Cannot change your own role
            if (IsSelf(id) && request.RoleId.HasValue && targetUser.RoleId != request.RoleId.Value)
            {
                return BadRequest(new { message = "You cannot modify your own role." });
            }

            // Check if modifying role, must satisfy hierarchy for the target role
            if (request.RoleId.HasValue && targetUser.RoleId != request.RoleId.Value)
            {
                if (!await CheckRoleHierarchy(request.RoleId.Value, request.Department ?? targetUser.Department))
                {
                    return StatusCode(403, new { message = "You do not have permission to assign this role." });
                }
            }
            // Check hierarchy for the user being edited (if it's not self)
            if (!IsSelf(id) && !await CheckRoleHierarchy(targetUser.RoleId, targetUser.Department))
            {
                return StatusCode(403, new { message = "You do not have permission to modify this user." });
            }

            targetUser.FullName = request.FullName ?? targetUser.FullName;
            targetUser.Department = request.Department ?? targetUser.Department;
            if (request.RoleId.HasValue) targetUser.RoleId = request.RoleId.Value;
            if (request.Salary.HasValue) targetUser.Salary = request.Salary.Value;

            await _userService.UpdateUserAsync(targetUser);
            return NoContent();
        }

        [HttpPost("{id}/reset-password")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<object>> ResetPassword(Guid id)
        {
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null) return NotFound();

            if (!await CheckRoleHierarchy(targetUser.RoleId, targetUser.Department))
            {
                return StatusCode(403, new { message = "You do not have permission to reset password for this user." });
            }

            var newPassword = await _userService.ResetPasswordAsync(id);
            if (newPassword == null) return NotFound();
            
            return Ok(new { GeneratedPassword = newPassword });
        }

        [HttpPatch("{id}/deactivate")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeactivateUser(Guid id)
        {
            if (IsSelf(id))
            {
                return BadRequest(new { message = "You cannot deactivate your own account." });
            }

            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null) return NotFound();

            if (!await CheckRoleHierarchy(targetUser.RoleId, targetUser.Department))
            {
                return StatusCode(403, new { message = "You do not have permission to deactivate this user." });
            }

            await _userService.DeactivateUserAsync(id);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            if (IsSelf(id))
            {
                return BadRequest(new { message = "You cannot delete your own account." });
            }

            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null) return NotFound();

            // Additional check: only allow deleting users who are already deactivated ("Đã nghỉ việc")
            if (targetUser.IsActive)
            {
                return BadRequest(new { message = "You can only delete deactivated users." });
            }

            if (!await CheckRoleHierarchy(targetUser.RoleId, targetUser.Department))
            {
                return StatusCode(403, new { message = "You do not have permission to delete this user." });
            }

            await _userService.DeleteUserAsync(id);
            return NoContent();
        }

        [HttpPost("bulk-regenerate-password")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkRegeneratePassword([FromBody] BulkRegeneratePasswordRequest request)
        {
            var passwords = await _userService.BulkRegeneratePasswordAsync(request.UserIds);
            return Ok(new { generatedPasswords = passwords });
        }

        [HttpPost("bulk-import")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkImportPreview(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File is empty.");

            // Mock CSV parsing for demo purposes
            // In a real app, use CsvHelper to parse the CSV
            // returning a preview JSON structure
            var previewData = new List<CreateUserRequest>();
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                var header = await reader.ReadLineAsync();
                string? line;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    var values = line.Split(',');
                    if (values.Length >= 3)
                    {
                        var dept = values.Length > 3 ? values[3].Trim() : null;
                        var validDepartments = new[] { "Sales", "Logistics", "Finance", "Board of Directors" };
                        
                        if (dept != null && !validDepartments.Contains(dept))
                        {
                            return BadRequest($"Department '{dept}' is not valid. Valid options: Sales, Logistics, Finance, Board of Directors.");
                        }

                        previewData.Add(new CreateUserRequest
                        {
                            FullName = values[0].Trim(),
                            Email = values[1].Trim(),
                            RoleId = int.TryParse(values[2], out var rId) ? rId : 4,
                            Department = dept
                        });
                    }
                }
            }
            return Ok(previewData);
        }

        [HttpPost("bulk-import/confirm")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkImportConfirm([FromBody] List<CreateUserRequest> request)
        {
            var validDepartments = new[] { "Sales", "Logistics", "Finance", "Board of Directors" };
            var usersToCreate = new List<User>();
            foreach (var req in request)
            {
                if (req.Department != null && !validDepartments.Contains(req.Department))
                {
                    return BadRequest($"Department '{req.Department}' is not valid.");
                }

                if (!await CheckRoleHierarchy(req.RoleId, req.Department))
                {
                    return Forbid($"You do not have permission to assign role {req.RoleId} to {req.Email}");
                }
                var existingUser = await _userService.GetUserByEmailAsync(req.Email);
                if (existingUser != null) continue; // skip existing

                usersToCreate.Add(new User
                {
                    FullName = req.FullName,
                    Email = req.Email,
                    RoleId = req.RoleId,
                    Department = req.Department
                });
            }

            var results = await _userService.BulkCreateUsersAsync(usersToCreate);
            return Ok(new { successCount = results.Count, credentials = results });
        }

        [HttpPatch("bulk-update")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkUpdate([FromBody] BulkUpdateRequest request)
        {
            var filteredUserIds = new List<Guid>();

            foreach (var id in request.UserIds)
            {
                if (IsSelf(id) && (request.TargetRoleId.HasValue || (request.IsActive.HasValue && request.IsActive == false)))
                {
                    // prevent self lock or self role change
                    continue;
                }

                var targetUser = await _userService.GetUserByIdAsync(id);
                if (targetUser != null && await CheckRoleHierarchy(targetUser.RoleId, targetUser.Department))
                {
                    if (!request.TargetRoleId.HasValue || await CheckRoleHierarchy(request.TargetRoleId.Value, targetUser.Department))
                    {
                        filteredUserIds.Add(id);
                    }
                }
            }

            await _userService.BulkUpdateUsersAsync(filteredUserIds, request.TargetRoleId, request.IsActive);
            return NoContent();
        }
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string? Department { get; set; }
        public decimal? Salary { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public int? RoleId { get; set; }
        public string? Department { get; set; }
        public decimal? Salary { get; set; }
    }

    public class BulkRegeneratePasswordRequest
    {
        public List<Guid> UserIds { get; set; } = new List<Guid>();
    }

    public class BulkUpdateRequest
    {
        public List<Guid> UserIds { get; set; } = new List<Guid>();
        public int? TargetRoleId { get; set; }
        public bool? IsActive { get; set; }
    }
}
