using MemoLib.Api.Data;

namespace MemoLib.Api.Middleware;

public class ConnectionValidationMiddleware
{
    private readonly RequestDelegate _next;
    private DateTime _lastCheck = DateTime.MinValue;
    private bool _lastStatus = true;
    private readonly TimeSpan _cacheInterval = TimeSpan.FromSeconds(30);

    public ConnectionValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, MemoLibDbContext db)
    {
        // Skip health check endpoints
        if (context.Request.Path.StartsWithSegments("/health"))
        {
            await _next(context);
            return;
        }

        // Cache check for 30 seconds
        if (DateTime.UtcNow - _lastCheck < _cacheInterval && _lastStatus)
        {
            await _next(context);
            return;
        }

        try
        {
            _lastStatus = await db.Database.CanConnectAsync();
            _lastCheck = DateTime.UtcNow;

            if (!_lastStatus)
            {
                context.Response.StatusCode = 503;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Service temporarily unavailable",
                    message = "Database connection unavailable"
                });
                return;
            }
        }
        catch
        {
            _lastStatus = false;
            context.Response.StatusCode = 503;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Service temporarily unavailable"
            });
            return;
        }

        await _next(context);
    }
}
