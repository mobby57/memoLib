using System.Collections.Concurrent;

namespace MemoLib.Api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<string, (DateTime, int)> _requests = new();
    private const int MaxRequests = 10;
    private static readonly TimeSpan TimeWindow = TimeSpan.FromMinutes(1);

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.Request.Path.Value ?? "";
        
        if (endpoint.Contains("/auth/login") || endpoint.Contains("/auth/register"))
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var key = $"{ip}:{endpoint}";

            var (lastReset, count) = _requests.GetOrAdd(key, _ => (DateTime.UtcNow, 0));

            if (DateTime.UtcNow - lastReset > TimeWindow)
            {
                _requests[key] = (DateTime.UtcNow, 1);
            }
            else if (count >= MaxRequests)
            {
                context.Response.StatusCode = 429;
                await context.Response.WriteAsync("Too many requests. Please try again later.");
                return;
            }
            else
            {
                _requests[key] = (lastReset, count + 1);
            }
        }

        await _next(context);
    }
}
