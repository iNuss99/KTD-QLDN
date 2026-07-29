using techretail_api.Core.Models;

namespace techretail_api.Services
{
    public interface IUserService
    {
        Task<PagedResult<User>> GetAllUsersAsync(int page = 1, int pageSize = 50, string? departmentFilter = null, int? roleIdFilter = null, bool? isActiveFilter = null);
        Task<User?> GetUserByIdAsync(Guid id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<(User User, string GeneratedPassword)> CreateUserAsync(User user);
        Task UpdateUserAsync(User user);
        Task DeactivateUserAsync(Guid id);
        Task DeleteUserAsync(Guid id);
        Task<bool> ChangePasswordAsync(Guid id, string oldPassword, string newPassword);
        Task<string?> ResetPasswordAsync(Guid id);
        Task<Dictionary<Guid, string>> BulkRegeneratePasswordAsync(List<Guid> userIds);
        Task<Dictionary<Guid, string>> BulkCreateUsersAsync(List<User> users);
        Task BulkUpdateUsersAsync(List<Guid> userIds, int? newRoleId, bool? isActive);
    }
}
