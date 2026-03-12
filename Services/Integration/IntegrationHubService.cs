using Microsoft.AspNetCore.SignalR;

namespace MemoLib.Api.Services.Integration;

public interface IIntegrationHubService
{
    Task NotifyIntegrationStatusAsync(string integration, string status, object? data = null);
    Task NotifyQueueUpdateAsync(string queueName, int size);
    Task NotifyMetricUpdateAsync(string metric, object value);
    Task BroadcastSystemAlertAsync(string message, string severity = "info");
}

public class IntegrationHubService : IIntegrationHubService
{
    private readonly IHubContext<IntegrationHub> _hubContext;
    private readonly ILogger<IntegrationHubService> _logger;

    public IntegrationHubService(IHubContext<IntegrationHub> hubContext, ILogger<IntegrationHubService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyIntegrationStatusAsync(string integration, string status, object? data = null)
    {
        await _hubContext.Clients.All.SendAsync("IntegrationStatusUpdate", new
        {
            integration,
            status,
            data,
            timestamp = DateTime.UtcNow
        });
        
        _logger.LogDebug("Integration status notification sent: {Integration} - {Status}", integration, status);
    }

    public async Task NotifyQueueUpdateAsync(string queueName, int size)
    {
        await _hubContext.Clients.All.SendAsync("QueueUpdate", new
        {
            queueName,
            size,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyMetricUpdateAsync(string metric, object value)
    {
        await _hubContext.Clients.All.SendAsync("MetricUpdate", new
        {
            metric,
            value,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastSystemAlertAsync(string message, string severity = "info")
    {
        await _hubContext.Clients.All.SendAsync("SystemAlert", new
        {
            message,
            severity,
            timestamp = DateTime.UtcNow
        });
        
        _logger.LogInformation("System alert broadcasted: {Message} ({Severity})", message, severity);
    }
}

public class IntegrationHub : Hub
{
    private readonly ILogger<IntegrationHub> _logger;

    public IntegrationHub(ILogger<IntegrationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogDebug("Client connected: {ConnectionId}", Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, "IntegrationMonitors");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogDebug("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "IntegrationMonitors");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinIntegrationGroup(string integration)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Integration_{integration}");
        _logger.LogDebug("Client {ConnectionId} joined group Integration_{Integration}", Context.ConnectionId, integration);
    }

    public async Task LeaveIntegrationGroup(string integration)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Integration_{integration}");
        _logger.LogDebug("Client {ConnectionId} left group Integration_{Integration}", Context.ConnectionId, integration);
    }
}