using Microsoft.Extensions.Caching.Memory;

namespace MemoLib.Api.Middleware;

public class CacheMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CacheMiddleware> _logger;

    public CacheMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<CacheMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method == "GET" && ShouldCache(context.Request.Path))
        {
            var cacheKey = $"cache_{context.Request.Path}_{context.Request.QueryString}";
            
            if (_cache.TryGetValue<string>(cacheKey, out var cachedResponse) && !string.IsNullOrEmpty(cachedResponse))
            {
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(cachedResponse);
                return;
            }

            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            await _next(context);

            if (context.Response.StatusCode == 200)
            {
                responseBody.Seek(0, SeekOrigin.Begin);
                var response = await new StreamReader(responseBody).ReadToEndAsync();
                
                _cache.Set(cacheKey, response, TimeSpan.FromMinutes(5));
                
                responseBody.Seek(0, SeekOrigin.Begin);
                await responseBody.CopyToAsync(originalBodyStream);
            }
            
            context.Response.Body = originalBodyStream;
        }
        else
        {
            await _next(context);
        }
    }

    private static bool ShouldCache(string path) => 
        path.StartsWith("/api/cases") || 
        path.StartsWith("/api/client") || 
        path.StartsWith("/api/stats");
}