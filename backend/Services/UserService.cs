using Microsoft.EntityFrameworkCore;
using techretail_api.Core.Models;
using techretail_api.Repositories;
using BCrypt.Net;

namespace techretail_api.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IEmailService _emailService;
        private readonly ILogger<UserService> _logger;

        public UserService(IRepository<User> userRepository, IEmailService emailService, ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<PagedResult<User>> GetAllUsersAsync(int page = 1, int pageSize = 50, string? departmentFilter = null, int? roleIdFilter = null, bool? isActiveFilter = null)
        {
            var query = _userRepository.Query();

            if (!string.IsNullOrEmpty(departmentFilter))
            {
                query = query.Where(u => u.Department == departmentFilter);
            }
            if (roleIdFilter.HasValue)
            {
                query = query.Where(u => u.RoleId == roleIdFilter.Value);
            }
            if (isActiveFilter.HasValue)
            {
                query = query.Where(u => u.IsActive == isActiveFilter.Value);
            }

            int totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(u => u.CreatedAt)
                             .Skip((page - 1) * pageSize)
                             .Take(pageSize)
                             .ToListAsync();

            return new PagedResult<User>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            var normalizedEmail = email?.Trim() ?? string.Empty;
            return await _userRepository.FindAsync(u => EF.Functions.ILike(u.Email, normalizedEmail));
        }

        private string GenerateRandomPassword()
        {
            const string validChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
            var chars = new char[10];
            for (int i = 0; i < 10; i++)
            {
                chars[i] = validChars[System.Security.Cryptography.RandomNumberGenerator.GetInt32(validChars.Length)];
            }
            return new string(chars);
        }

        public async Task<(User User, string GeneratedPassword)> CreateUserAsync(User user)
        {
            user.Email = user.Email?.Trim().ToLower() ?? string.Empty;
            string generatedPassword = GenerateRandomPassword();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(generatedPassword);
            user.CreatedAt = DateTime.UtcNow;
            user.IsActive = true;
            user.IsFirstLogin = true;
            user.TempPasswordExpiresAt = DateTime.UtcNow.AddHours(24);

            if (user.RoleId == 0)
            {
                user.RoleId = 4; // Default to Sales Staff
            }

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            // Send welcome email in background to prevent blocking API if SMTP times out
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName, generatedPassword);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
                }
            });

            return (user, generatedPassword);
        }

        public async Task UpdateUserAsync(User user)
        {
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
        }

        public async Task DeactivateUserAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                user.IsActive = false;
                _userRepository.Update(user);
                await _userRepository.SaveChangesAsync();
            }
        }

        public async Task DeleteUserAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                _userRepository.Remove(user);
                await _userRepository.SaveChangesAsync();
            }
        }

        public async Task<bool> ChangePasswordAsync(Guid id, string oldPassword, string newPassword)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            if (!BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash)) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.IsFirstLogin = false;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return true;
        }

        public async Task<string?> ResetPasswordAsync(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;

            string generatedPassword = GenerateRandomPassword();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(generatedPassword);
            user.IsFirstLogin = true;
            user.TempPasswordExpiresAt = DateTime.UtcNow.AddHours(24);

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            // Notify user of password reset via email in background
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, generatedPassword);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
                }
            });

            return generatedPassword;
        }

        public async Task<Dictionary<Guid, string>> BulkRegeneratePasswordAsync(List<Guid> userIds)
        {
            var generatedPasswords = new Dictionary<Guid, string>();
            if (!userIds.Any()) return generatedPasswords;

            // Single query to load all target users
            var users = await _userRepository.Query()
                .Where(u => userIds.Contains(u.Id) && u.IsActive)
                .ToListAsync();

            foreach (var user in users)
            {
                string password = GenerateRandomPassword();
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                user.IsFirstLogin = true;
                user.TempPasswordExpiresAt = DateTime.UtcNow.AddHours(24);
                _userRepository.Update(user);
                generatedPasswords.Add(user.Id, password);
            }
            if (generatedPasswords.Any())
                await _userRepository.SaveChangesAsync();

            return generatedPasswords;
        }
        public async Task<Dictionary<Guid, string>> BulkCreateUsersAsync(List<User> users)
        {
            var generatedPasswords = new Dictionary<Guid, string>();
            foreach (var user in users)
            {
                user.Email = user.Email?.Trim().ToLower() ?? string.Empty;
                string generatedPassword = GenerateRandomPassword();
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(generatedPassword);
                user.CreatedAt = DateTime.UtcNow;
                user.IsActive = true;
                user.IsFirstLogin = true;
                user.TempPasswordExpiresAt = DateTime.UtcNow.AddHours(24);

                await _userRepository.AddAsync(user);
                generatedPasswords.Add(user.Id, generatedPassword);
            }
            if (users.Any())
            {
                await _userRepository.SaveChangesAsync();
            }
            return generatedPasswords;
        }

        public async Task BulkUpdateUsersAsync(List<Guid> userIds, int? newRoleId, bool? isActive)
        {
            if (!userIds.Any()) return;

            // Single query to load all target users
            var users = await _userRepository.Query()
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync();

            foreach (var user in users)
            {
                if (newRoleId.HasValue) user.RoleId = newRoleId.Value;
                if (isActive.HasValue) user.IsActive = isActive.Value;
                _userRepository.Update(user);
            }
            if (users.Any())
                await _userRepository.SaveChangesAsync();
        }
    }
}
