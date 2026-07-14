using System.ComponentModel.DataAnnotations;

namespace techretail_api.Core.Models
{
    /// <summary>
    /// Lưu trữ cấu hình ma trận quyền: mỗi hành động + vai trò có được phép không.
    /// </summary>
    public class RolePermission
    {
        [Key]
        public int Id { get; set; }

        /// <summary>Mã hành động, ví dụ: "perm-1"</summary>
        [Required]
        [MaxLength(50)]
        public string PermissionKey { get; set; } = string.Empty;

        /// <summary>Tên vai trò, ví dụ: "Admin", "Manager", "Accountant", "Sales Staff", "Warehouse Staff"</summary>
        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        /// <summary>Vai trò này có quyền thực hiện hành động không</summary>
        public bool IsGranted { get; set; }
    }
}
