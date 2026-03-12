using System.Threading.Channels;

namespace MemoLib.Api.Services.Integration;

public interface IIntegrationQueueService
{
    Task EnqueueAsync<T>(T item, string queueName = "default") where T : class;
    Task<T?> DequeueAsync<T>(string queueName = "default", CancellationToken cancellationToken = default) where T : class;
    Task<int> GetQueueCountAsync(string queueName = "default");
}

public class IntegrationQueueService : IIntegrationQueueService
{
    private readonly Dictionary<string, Channel<object>> _queues = new();
    private readonly ILogger<IntegrationQueueService> _logger;
    private readonly object _lock = new();

    public IntegrationQueueService(ILogger<IntegrationQueueService> logger)
    {
        _logger = logger;
    }

    public async Task EnqueueAsync<T>(T item, string queueName = "default") where T : class
    {
        var channel = GetOrCreateQueue(queueName);
        await channel.Writer.WriteAsync(item);
        _logger.LogDebug("Item enqueued to {QueueName}", queueName);
    }

    public async Task<T?> DequeueAsync<T>(string queueName = "default", CancellationToken cancellationToken = default) where T : class
    {
        var channel = GetOrCreateQueue(queueName);
        
        if (await channel.Reader.WaitToReadAsync(cancellationToken))
        {
            if (channel.Reader.TryRead(out var item) && item is T typedItem)
            {
                _logger.LogDebug("Item dequeued from {QueueName}", queueName);
                return typedItem;
            }
        }
        
        return null;
    }

    public Task<int> GetQueueCountAsync(string queueName = "default")
    {
        lock (_lock)
        {
            if (_queues.TryGetValue(queueName, out var channel))
            {
                return Task.FromResult(channel.Reader.Count);
            }
            return Task.FromResult(0);
        }
    }

    private Channel<object> GetOrCreateQueue(string queueName)
    {
        lock (_lock)
        {
            if (!_queues.TryGetValue(queueName, out var channel))
            {
                var options = new BoundedChannelOptions(1000)
                {
                    FullMode = BoundedChannelFullMode.Wait,
                    SingleReader = false,
                    SingleWriter = false
                };
                
                channel = Channel.CreateBounded<object>(options);
                _queues[queueName] = channel;
            }
            
            return channel;
        }
    }
}

public class EmailProcessingItem
{
    public string EmailId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
    public int Priority { get; set; }
}

public class WebhookProcessingItem
{
    public string Source { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
}

public class NotificationItem
{
    public string Type { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public DateTime ScheduledAt { get; set; }
}