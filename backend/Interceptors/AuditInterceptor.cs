using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Text.Json;
using techretail_api.Models;

using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace techretail_api.Interceptors
{
    public class AuditInterceptor : SaveChangesInterceptor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditInterceptor(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
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

        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            var context = eventData.Context;
            if (context == null) return base.SavingChanges(eventData, result);

            var entries = context.ChangeTracker.Entries()
                .Where(e => e.Entity is not SystemLog && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
                .ToList();

            foreach (var entry in entries)
            {
                var auditEntry = new SystemLog
                {
                    Id = Guid.NewGuid(),
                    UserId = GetCurrentUserId(), 
                    TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                    CreatedAt = DateTime.UtcNow
                };

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.ActionType = "CREATE";
                        auditEntry.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                        break;

                    case EntityState.Deleted:
                        auditEntry.ActionType = "DELETE";
                        auditEntry.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                        break;

                    case EntityState.Modified:
                        auditEntry.ActionType = "UPDATE";
                        auditEntry.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                        auditEntry.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                        break;
                }

                context.Set<SystemLog>().Add(auditEntry);
            }

            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var context = eventData.Context;
            if (context == null) return base.SavingChangesAsync(eventData, result, cancellationToken);

            var entries = context.ChangeTracker.Entries()
                .Where(e => e.Entity is not SystemLog && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
                .ToList();

            foreach (var entry in entries)
            {
                var auditEntry = new SystemLog
                {
                    Id = Guid.NewGuid(),
                    UserId = GetCurrentUserId(),
                    TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                    CreatedAt = DateTime.UtcNow
                };

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.ActionType = "CREATE";
                        auditEntry.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                        break;

                    case EntityState.Deleted:
                        auditEntry.ActionType = "DELETE";
                        auditEntry.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                        break;

                    case EntityState.Modified:
                        auditEntry.ActionType = "UPDATE";
                        auditEntry.OldValues = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                        auditEntry.NewValues = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
                        break;
                }

                context.Set<SystemLog>().Add(auditEntry);
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
