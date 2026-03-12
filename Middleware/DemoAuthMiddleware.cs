using System.Text;

namespace MemoLib.Api.Middleware;

public class DemoAuthMiddleware
{
    private readonly RequestDelegate _next;
    private const string DemoUser = "demo";
    private const string DemoPass = "MemoLib2025!";

    public DemoAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Protéger uniquement les routes /demo
        if (context.Request.Path.StartsWithSegments("/demo"))
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            
            if (string.IsNullOrEmpty(authHeader) || !IsValidAuth(authHeader))
            {
                context.Response.StatusCode = 401;
                context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"MemoLib Demo\"";
                await context.Response.WriteAsync("Unauthorized - Demo Access Required");
                return;
            }
        }

        await _next(context);
    }

    private bool IsValidAuth(string authHeader)
    {
        if (!authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            return false;

        try
        {
            var encoded = authHeader.Substring("Basic ".Length).Trim();
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            return decoded == $"{DemoUser}:{DemoPass}";
        }
        catch
        {
            return false;
        }
    }
}