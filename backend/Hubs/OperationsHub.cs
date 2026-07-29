using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace techretail_api.Hubs
{
    /// <summary>
    /// SignalR Hub cho real-time operations notifications.
    /// Groups:
    ///   - "Admin"     : nhận mọi event
    ///   - "Manager"   : nhận order + stock events
    ///   - "Sales"     : nhận new-order events
    ///   - "Warehouse" : nhận stock + order events
    /// </summary>
    [Authorize]
    public class OperationsHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? Context.User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

            if (!string.IsNullOrEmpty(role))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, role);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}
