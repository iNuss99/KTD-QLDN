using System.ComponentModel.DataAnnotations;

namespace techretail_api.Core.Models
{
    public class Order
    {
        public Guid Id { get; set; }

        [StringLength(50)]
        public string OrderCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên khách hàng không được để trống")]
        [StringLength(200, ErrorMessage = "Tên khách hàng tối đa 200 ký tự")]
        public string CustomerName { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Tổng phụ không được âm")]
        public decimal SubTotal { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giảm giá không được âm")]
        public decimal DiscountAmount { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Thuế không được âm")]
        public decimal TaxAmount { get; set; } = 0;

        public decimal TotalAmount { get; set; }

        [Required]
        [RegularExpression("^(Pending|Confirmed|Shipped|Delivered|Cancelled)$",
            ErrorMessage = "Trạng thái đơn hàng không hợp lệ")]
        public string OrderStatus { get; set; } = "Pending";

        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required(ErrorMessage = "Đơn hàng phải có ít nhất một sản phẩm")]
        [MinLength(1, ErrorMessage = "Đơn hàng phải có ít nhất một sản phẩm")]
        public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }
}
