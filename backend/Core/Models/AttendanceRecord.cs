using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace techretail_api.Core.Models
{
    public class AttendanceRecord
    {
        [Key]
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public DateTime Date { get; set; }

        public DateTime? CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Present"; // Present, Absent, Late, HalfDay

        [MaxLength(255)]
        public string? Notes { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}
