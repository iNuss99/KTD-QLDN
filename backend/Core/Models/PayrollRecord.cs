using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace techretail_api.Core.Models
{
    public class PayrollRecord
    {
        [Key]
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public int Month { get; set; }

        public int Year { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseSalary { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Bonus { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Deductions { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal NetPay { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Paid

        public DateTime? PaymentDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}
