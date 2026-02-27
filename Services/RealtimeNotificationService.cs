using Microsoft.AspNetCore.SignalR;
using MemoLib.Api.Hubs;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class RealtimeNotificationService
{
    private readonly IHubContext<RealtimeHub> _hubContext;

    public RealtimeNotificationService(IHubContext<RealtimeHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyNewCommentAsync(Guid caseId, CaseComment comment, string userName)
    {
        await _hubContext.Clients.Group($"case-{caseId}")
            .SendAsync("NewComment", new { comment, userName });
    }

    public async Task NotifyStatusChangedAsync(Guid caseId, string oldStatus, string newStatus, string userName)
    {
        await _hubContext.Clients.Group($"case-{caseId}")
            .SendAsync("StatusChanged", new { oldStatus, newStatus, userName });
    }

    public async Task NotifyNewMessageAsync(Guid caseId, string channel, string from, string preview)
    {
        await _hubContext.Clients.Group($"case-{caseId}")
            .SendAsync("NewMessage", new { channel, from, preview });
    }

    public async Task NotifyDocumentUploadedAsync(Guid caseId, string fileName, string userName)
    {
        await _hubContext.Clients.Group($"case-{caseId}")
            .SendAsync("DocumentUploaded", new { fileName, userName });
    }

    public async Task NotifyUserAsync(string userId, Notification notification)
    {
        await _hubContext.Clients.User(userId)
            .SendAsync("Notification", notification);
    }
}
