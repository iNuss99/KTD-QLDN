namespace techretail_api.Core.Models
{
    public class SystemLog
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string TableName { get; set; } = string.Empty;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public Guid? CorrelationId { get; set; }
        public string SeverityLevel { get; set; } = "Normal";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
