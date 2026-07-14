using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace techretail_api.Core.Models
{
    public class StockAdjustment
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        [JsonIgnore]
        public Product? Product { get; set; }

        [Required]
        public Guid AdjustedBy { get; set; }

        [ForeignKey(nameof(AdjustedBy))]
        [JsonIgnore]
        public User? User { get; set; }

        [Required]
        public int OldQuantity { get; set; }

        [Required]
        public int NewQuantity { get; set; }

        [Required]
        [MaxLength(255)]
        public string Reason { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
