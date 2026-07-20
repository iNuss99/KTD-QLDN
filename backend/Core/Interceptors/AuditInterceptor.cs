using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Text.Json;
using techretail_api.Core.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using techretail_api.Hubs;
using System.Dynamic;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace techretail_api.Core.Interceptors
{
    public class AuditInterceptor : SaveChangesInterceptor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<OperationsHub> _hubContext;
        private readonly string[] _sensitiveProperties = new[] { "PasswordHash", "Salt" };

        public AuditInterceptor(IHttpContextAccessor httpContextAccessor, IHubContext<OperationsHub> hubContext)
        {
            _httpContextAccessor = httpContextAccessor;
            _hubContext = hubContext;
        }

        private Guid GetCurrentUserId()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdStr, out var userId))
            {
                return userId;
            }
            return Guid.Empty;
        }

        private string? GetIpAddress()
        {
            return _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
        }

        private string? GetEntityId(EntityEntry entry)
        {
            var pk = entry.Metadata.FindPrimaryKey();
            if (pk == null) return null;
            var values = pk.Properties.Select(p => entry.Property(p.Name).CurrentValue?.ToString()).ToList();
            return string.Join(",", values);
        }

        private string MaskSensitiveData(PropertyValues values)
        {
            var expando = new ExpandoObject() as IDictionary<string, object?>;
            foreach (var property in values.Properties)
            {
                var val = values[property];
                if (_sensitiveProperties.Contains(property.Name))
                {
                    expando.Add(property.Name, "***MASKED***");
                }
                else
                {
                    expando.Add(property.Name, val);
                }
            }
            return JsonSerializer.Serialize(expando);
        }

        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            var context = eventData.Context;
            if (context == null) return base.SavingChanges(eventData, result);

            var userId = GetCurrentUserId();
            // We might still want to log even if UserId is empty (e.g. system background jobs), but current logic returns
            if (userId == Guid.Empty) return base.SavingChanges(eventData, result);

            var entries = context.ChangeTracker.Entries()
                .Where(e => e.Entity is not SystemLog && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
                .ToList();

            var activities = new List<object>();

            foreach (var entry in entries)
            {
                var tableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name;
                var entityId = GetEntityId(entry);

                var auditEntry = new SystemLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId, 
                    TableName = tableName,
                    EntityId = entityId,
                    IpAddress = GetIpAddress(),
                    CreatedAt = DateTime.UtcNow
                };

                string actionLabel = "";
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.ActionType = "CREATE";
                        actionLabel = "Tạo mới";
                        auditEntry.NewValues = MaskSensitiveData(entry.CurrentValues);
                        break;

                    case EntityState.Deleted:
                        auditEntry.ActionType = "DELETE";
                        actionLabel = "Xóa";
                        auditEntry.OldValues = MaskSensitiveData(entry.OriginalValues);
                        break;

                    case EntityState.Modified:
                        auditEntry.ActionType = "UPDATE";
                        actionLabel = "Cập nhật";
                        auditEntry.OldValues = MaskSensitiveData(entry.OriginalValues);
                        auditEntry.NewValues = MaskSensitiveData(entry.CurrentValues);
                        break;
                }

                context.Set<SystemLog>().Add(auditEntry);

                // Prepare notification
                activities.Add(new {
                    tableName = tableName,
                    action = auditEntry.ActionType,
                    actionLabel = actionLabel,
                    entityId = entityId,
                    time = auditEntry.CreatedAt
                });
            }

            // Fire and forget SignalR notification (synchronous SaveChanges shouldn't block for SignalR)
            if (activities.Any())
            {
                _ = _hubContext.Clients.All.SendAsync("onSystemActivity", activities);
            }

            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var context = eventData.Context;
            if (context == null) return base.SavingChangesAsync(eventData, result, cancellationToken);

            var userId = GetCurrentUserId();
            if (userId == Guid.Empty) return base.SavingChangesAsync(eventData, result, cancellationToken);

            var entries = context.ChangeTracker.Entries()
                .Where(e => e.Entity is not SystemLog && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
                .ToList();

            var activities = new List<object>();

            foreach (var entry in entries)
            {
                var tableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name;
                var entityId = GetEntityId(entry);

                var auditEntry = new SystemLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    TableName = tableName,
                    EntityId = entityId,
                    IpAddress = GetIpAddress(),
                    CreatedAt = DateTime.UtcNow
                };

                string actionLabel = "";
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.ActionType = "CREATE";
                        actionLabel = "Tạo mới";
                        auditEntry.NewValues = MaskSensitiveData(entry.CurrentValues);
                        break;

                    case EntityState.Deleted:
                        auditEntry.ActionType = "DELETE";
                        actionLabel = "Xóa";
                        auditEntry.OldValues = MaskSensitiveData(entry.OriginalValues);
                        break;

                    case EntityState.Modified:
                        auditEntry.ActionType = "UPDATE";
                        actionLabel = "Cập nhật";
                        auditEntry.OldValues = MaskSensitiveData(entry.OriginalValues);
                        auditEntry.NewValues = MaskSensitiveData(entry.CurrentValues);
                        break;
                }

                context.Set<SystemLog>().Add(auditEntry);

                activities.Add(new {
                    tableName = tableName,
                    action = auditEntry.ActionType,
                    actionLabel = actionLabel,
                    entityId = entityId,
                    time = auditEntry.CreatedAt
                });
            }

            if (activities.Any())
            {
                _ = _hubContext.Clients.All.SendAsync("onSystemActivity", activities, cancellationToken);
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
