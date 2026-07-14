namespace techretail_api.Core.Models
{
    public class Product
    {
        public Guid Id { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal CostPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public int StockQuantity { get; set; } = 0;
        public bool IsDeleted { get; set; } = false;
        public byte[]? RowVersion { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
