using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace techretail_api.Core.Models
{
    public class Role
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        public int HierarchyLevel { get; set; }

        [MaxLength(255)]
        public string? Description { get; set; }

        [JsonIgnore]
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
