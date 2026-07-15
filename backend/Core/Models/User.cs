using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace techretail_api.Core.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;
        
        public int RoleId { get; set; }
        
        [MaxLength(100)]
        public string? Department { get; set; }

        public string? AvatarUrl { get; set; }

        [MaxLength(100)]
        public string? JobTitle { get; set; }
        
        [ForeignKey(nameof(RoleId))]
        public Role? Role { get; set; }
        
        public bool IsActive { get; set; } = true;
        public bool IsFirstLogin { get; set; } = true;
        
        public DateTime? LockedUntil { get; set; }
        public DateTime? TempPasswordExpiresAt { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Salary { get; set; } = 0;

        // HR Fields
        public DateTime? JoinDate { get; set; }
        public int LeaveDaysTotal { get; set; } = 12; // Default 12 days per year
        public int LeaveDaysUsed { get; set; } = 0;
    }
}
