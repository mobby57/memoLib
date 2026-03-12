using MemoLib.Api.Services.Integration;
using System.Net;

namespace MemoLib.Api.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimitService _rateLimitService;
    private readonly ILogger<RateLimitMiddleware> _logger;

    public RateLimitMiddleware(
        RequestDelegate next,
        IRateLimitService rateLimitService,
        ILogger<RateLimitMiddleware> logger)
    {
        _next = next;
        _rateLimitService = rateLimitService;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip rate limiting for health checks
        if (context.Request.Path.StartsWithSegments("/health"))
        {
            await _next(context);
            return;
        }

        var key = GetRateLimitKey(context);
        var policy = GetRateLimitPolicy(context);

        var result = await _rateLimitService.CheckRateLimitAsync(key, policy);

        // Add rate limit headers
        context.Response.Headers.Add("X-RateLimit-Limit", policy.MaxRequests.ToString());
        context.Response.Headers.Add("X-RateLimit-Remaining", result.RemainingRequests.ToString());
        context.Response.Headers.Add("X-RateLimit-Reset", DateTimeOffset.UtcNow.Add(policy.Window).ToUnixTimeSeconds().ToString());

        if (!result.IsAllowed)
        {
            context.Response.Headers.Add("Retry-After", ((int)result.RetryAfter.TotalSeconds).ToString());
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            
            await context.Response.WriteAsync("Rate limit exceeded. Try again later.");
            
            _logger.LogWarning("Rate limit exceeded for {Key} from {IP}", key, context.Connection.RemoteIpAddress);
            return;
        }

        await _next(context);
    }

    private string GetRateLimitKey(HttpContext context)
    {
        // Use user ID if authenticated, otherwise IP address
        var userId = context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(userId))
        {
            return $"user:{userId}";
        }

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"ip:{ip}";
    }

    private RateLimitPolicy GetRateLimitPolicy(HttpContext context)
    {
        // Different policies based on endpoint
        var path = context.Request.Path.Value?.ToLower() ?? "";

        return path switch
        {
            var p when p.StartsWith("/api/auth") => new RateLimitPolicy
            {
                MaxRequests = 5,
                Window = TimeSpan.FromMinutes(1),
                Strategy = RateLimitStrategy.SlidingWindow
            },
            var p when p.StartsWith("/api/webhooks") => new RateLimitPolicy
            {
                MaxRequests = 100,
                Window = TimeSpan.FromMinutes(1),
                Strategy = RateLimitStrategy.TokenBucket
            },
            _ => new RateLimitPolicy
            {
                MaxRequests = 60,
                Window = TimeSpan.FromMinutes(1),
                Strategy = RateLimitStrategy.SlidingWindow
            }
        };
    }
}