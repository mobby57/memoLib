using System.Collections.Concurrent;

namespace MemoLib.Api.Services.Integration;

public interface IRateLimitService
{
    Task<bool> IsAllowedAsync(string key, int maxRequests, TimeSpan window);
    Task<RateLimitResult> CheckRateLimitAsync(string key, RateLimitPolicy policy);
}

public class RateLimitResult
{
    public bool IsAllowed { get; set; }
    public int RemainingRequests { get; set; }
    public TimeSpan RetryAfter { get; set; }
}

public class RateLimitPolicy
{
    public int MaxRequests { get; set; }
    public TimeSpan Window { get; set; }
    public RateLimitStrategy Strategy { get; set; } = RateLimitStrategy.SlidingWindow;
}

public enum RateLimitStrategy
{
    FixedWindow,
    SlidingWindow,
    TokenBucket
}

public class RateLimitService : IRateLimitService
{
    private readonly ConcurrentDictionary<string, RateLimitEntry> _cache = new();
    private readonly ILogger<RateLimitService> _logger;

    public RateLimitService(ILogger<RateLimitService> logger)
    {
        _logger = logger;
    }

    public Task<bool> IsAllowedAsync(string key, int maxRequests, TimeSpan window)
    {
        var policy = new RateLimitPolicy
        {
            MaxRequests = maxRequests,
            Window = window,
            Strategy = RateLimitStrategy.SlidingWindow
        };

        return CheckRateLimitAsync(key, policy).ContinueWith(t => t.Result.IsAllowed);
    }

    public Task<RateLimitResult> CheckRateLimitAsync(string key, RateLimitPolicy policy)
    {
        var now = DateTime.UtcNow;
        var entry = _cache.AddOrUpdate(key, 
            new RateLimitEntry { LastReset = now, RequestCount = 1 },
            (k, existing) => UpdateEntry(existing, now, policy));

        var isAllowed = entry.RequestCount <= policy.MaxRequests;
        var remaining = Math.Max(0, policy.MaxRequests - entry.RequestCount);
        var retryAfter = isAllowed ? TimeSpan.Zero : policy.Window - (now - entry.LastReset);

        if (!isAllowed)
        {
            _logger.LogWarning("Rate limit exceeded for key {Key}. Count: {Count}, Max: {Max}", 
                key, entry.RequestCount, policy.MaxRequests);
        }

        return Task.FromResult(new RateLimitResult
        {
            IsAllowed = isAllowed,
            RemainingRequests = remaining,
            RetryAfter = retryAfter
        });
    }

    private RateLimitEntry UpdateEntry(RateLimitEntry existing, DateTime now, RateLimitPolicy policy)
    {
        return policy.Strategy switch
        {
            RateLimitStrategy.FixedWindow => UpdateFixedWindow(existing, now, policy.Window),
            RateLimitStrategy.SlidingWindow => UpdateSlidingWindow(existing, now, policy.Window),
            RateLimitStrategy.TokenBucket => UpdateTokenBucket(existing, now, policy),
            _ => existing
        };
    }

    private RateLimitEntry UpdateFixedWindow(RateLimitEntry existing, DateTime now, TimeSpan window)
    {
        if (now - existing.LastReset >= window)
        {
            return new RateLimitEntry { LastReset = now, RequestCount = 1 };
        }
        
        existing.RequestCount++;
        return existing;
    }

    private RateLimitEntry UpdateSlidingWindow(RateLimitEntry existing, DateTime now, TimeSpan window)
    {
        var elapsed = now - existing.LastReset;
        if (elapsed >= window)
        {
            return new RateLimitEntry { LastReset = now, RequestCount = 1 };
        }

        existing.RequestCount++;
        return existing;
    }

    private RateLimitEntry UpdateTokenBucket(RateLimitEntry existing, DateTime now, RateLimitPolicy policy)
    {
        var elapsed = now - existing.LastReset;
        var tokensToAdd = (int)(elapsed.TotalSeconds * policy.MaxRequests / policy.Window.TotalSeconds);
        
        existing.RequestCount = Math.Max(0, existing.RequestCount - tokensToAdd) + 1;
        existing.LastReset = now;
        
        return existing;
    }

    private class RateLimitEntry
    {
        public DateTime LastReset { get; set; }
        public int RequestCount { get; set; }
    }
}