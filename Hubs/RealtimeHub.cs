using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace MemoLib.Api.Hubs;

[Authorize]
public class RealtimeHub : Hub
{
    public async Task JoinCaseRoom(string caseId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"case-{caseId}");
    }

    public async Task LeaveCaseRoom(string caseId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"case-{caseId}");
    }

    public async Task SendTypingIndicator(string caseId, string userName)
    {
        await Clients.OthersInGroup($"case-{caseId}").SendAsync("UserTyping", userName);
    }
}
