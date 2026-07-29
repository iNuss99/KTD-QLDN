using techretail_api.Core.Models;

namespace techretail_api.Services
{
    public class SearchResultDto
    {
        public List<UserSearchDto> Users { get; set; } = new();
        public List<ProductSearchDto> Products { get; set; } = new();
        public List<OrderSearchDto> Orders { get; set; } = new();
    }

    public class UserSearchDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class ProductSearchDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class OrderSearchDto
    {
        public Guid Id { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public interface ISearchService
    {
        Task<SearchResultDto> GlobalSearchAsync(string query);
    }
}
