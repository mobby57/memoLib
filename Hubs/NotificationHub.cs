using Microsoft.AspNetCore.SignalR;

namespace MemoLib.Api.Hubs;

public class NotificationHub : Hub
{
    public async Task SendUrgentAlert(string message)
    {
        await Clients.All.SendAsync("UrgentAlert", new { message, timestamp = DateTime.UtcNow });
    }

    public async Task SendDeadlineAlert(string message)
    {
        await Clients.All.SendAsync("DeadlineAlert", new { message, timestamp = DateTime.UtcNow });
    }

    public async Task SendNewEmailNotification(int count)
    {
        await Clients.All.SendAsync("NewEmail", new { count, timestamp = DateTime.UtcNow });
    }
}