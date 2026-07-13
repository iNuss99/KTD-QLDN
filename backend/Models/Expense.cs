using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace techretail_api.Models
{
    public class Expense
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        public decimal Amount { get; set; }

        [MaxLength(255)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }
    }
}
