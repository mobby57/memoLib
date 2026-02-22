using Microsoft.AspNetCore.SignalR;
using MemoLib.Api.Hubs;
using MemoLib.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class PushNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly MemoLibDbContext _context;

    public PushNotificationService(IHubContext<NotificationHub> hubContext, MemoLibDbContext context)
    {
        _hubContext = hubContext;
        _context = context;
    }

    public async Task NotifyNewEmailAsync(Guid userId, string from, string subject)
    {
        await _hubContext.Clients.Group($"user_{userId}")
            .SendAsync("NewEmail", new { from, subject, timestamp = DateTime.UtcNow });
    }

    public async Task NotifyAnomalyAsync(Guid userId, string type, string message)
    {
        await _hubContext.Clients.Group($"user_{userId}")
            .SendAsync("Anomaly", new { type, message, timestamp = DateTime.UtcNow });
    }

    public async Task NotifyQuestionnaireCompletedAsync(Guid userId, string questionnaireName)
    {
        await _hubContext.Clients.Group($"user_{userId}")
            .SendAsync("QuestionnaireCompleted", new { questionnaireName, timestamp = DateTime.UtcNow });
    }
}