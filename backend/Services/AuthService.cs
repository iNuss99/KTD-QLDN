using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using techretail_api.Core.Models;
using techretail_api.Repositories;

namespace techretail_api.Services
{
    public interface IAuthService
    {
        Task<(string? AccessToken, string? RefreshToken)> LoginAsync(string email, string password);
        Task<(string? AccessToken, string? RefreshToken)> RefreshTokenAsync(string token);
        Task<bool> RevokeTokenAsync(string token);
    }

    public class AuthService : IAuthService
    {
        private readonly IUserService _userService;
        private readonly IRepository<Role> _roleRepository;
        private readonly IConfiguration _configuration;
        private readonly IRepository<RefreshToken> _refreshTokenRepository;

        public AuthService(IUserService userService, IRepository<Role> roleRepository, IConfiguration configuration, IRepository<RefreshToken> refreshTokenRepository)
        {
            _userService = userService;
            _roleRepository = roleRepository;
            _configuration = configuration;
            _refreshTokenRepository = refreshTokenRepository;
        }

        public async Task<(string? AccessToken, string? RefreshToken)> LoginAsync(string email, string password)
        {
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null || !user.IsActive)
                return (null, null);

            if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
                throw new UnauthorizedAccessException($"Account locked until {user.LockedUntil.Value.ToLocalTime()}. Please try again later.");

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            if (!isPasswordValid)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 5)
                {
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
                    user.FailedLoginAttempts = 0; // Reset after locking
                }
                await _userService.UpdateUserAsync(user);
                return (null, null);
            }

            if (user.IsFirstLogin && user.TempPasswordExpiresAt.HasValue && user.TempPasswordExpiresAt.Value < DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Temporary password has expired. Please contact administrator to regenerate.");
            }

            // Reset failed attempts on success
            if (user.FailedLoginAttempts > 0 || user.LockedUntil.HasValue)
            {
                user.FailedLoginAttempts = 0;
                user.LockedUntil = null;
                await _userService.UpdateUserAsync(user);
            }

            // Get Role
            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            var roleName = role?.RoleName ?? "Sales Staff";

            var accessToken = GenerateJwtToken(user, roleName);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id);

            return (accessToken, refreshToken);
        }

        public async Task<(string? AccessToken, string? RefreshToken)> RefreshTokenAsync(string token)
        {
            var refreshTokens = await _refreshTokenRepository.GetAllAsync();
            var existingToken = refreshTokens.FirstOrDefault(t => t.Token == token);
            
            if (existingToken == null || !existingToken.IsActive)
                return (null, null);

            // Revoke the old token
            existingToken.IsRevoked = true;
            _refreshTokenRepository.Update(existingToken);
            await _refreshTokenRepository.SaveChangesAsync();

            var user = await _userService.GetUserByIdAsync(existingToken.UserId);
            if (user == null || !user.IsActive)
                return (null, null);

            var role = await _roleRepository.GetByIdAsync(user.RoleId);
            var roleName = role?.RoleName ?? "Sales Staff";

            var newAccessToken = GenerateJwtToken(user, roleName);
            var newRefreshToken = await GenerateRefreshTokenAsync(user.Id);

            return (newAccessToken, newRefreshToken);
        }

        public async Task<bool> RevokeTokenAsync(string token)
        {
            var refreshTokens = await _refreshTokenRepository.GetAllAsync();
            var existingToken = refreshTokens.FirstOrDefault(t => t.Token == token);

            if (existingToken == null || !existingToken.IsActive)
                return false;

            existingToken.IsRevoked = true;
            _refreshTokenRepository.Update(existingToken);
            await _refreshTokenRepository.SaveChangesAsync();
            return true;
        }

        private async Task<string> GenerateRefreshTokenAsync(Guid userId)
        {
            var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };
            await _refreshTokenRepository.AddAsync(refreshToken);
            await _refreshTokenRepository.SaveChangesAsync();
            return token;
        }

        private string GenerateJwtToken(User user, string roleName)
        {
            var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt Key is missing");
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Role, roleName)
            };

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
