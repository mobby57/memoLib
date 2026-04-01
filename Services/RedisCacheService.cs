using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace MemoLib.Api.Services;

public class RedisCacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly bool _isRedisConfigured;

    public RedisCacheService(
        IDistributedCache cache,
        ILogger<RedisCacheService> logger,
        IConfiguration config)
    {
        _cache = cache;
        _logger = logger;
        _isRedisConfigured = !string.IsNullOrWhiteSpace(config.GetConnectionString("Redis"));
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        try
        {
            var data = await _cache.GetStringAsync(key);
            if (data == null) return null;
            return JsonSerializer.Deserialize<T>(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache GET failed for key {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(10)
            };
            var json = JsonSerializer.Serialize(value);
            await _cache.SetStringAsync(key, json, options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache SET failed for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _cache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache REMOVE failed for key {Key}", key);
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class
    {
        var cached = await GetAsync<T>(key);
        if (cached != null) return cached;

        var value = await factory();
        await SetAsync(key, value, expiration);
        return value;
    }

    public async Task InvalidatePatternAsync(string prefix)
    {
        // Redis SCAN n'est pas dispo via IDistributedCache, on invalide par clé connue
        _logger.LogInformation("Cache invalidation requested for prefix: {Prefix}", prefix);
        await Task.CompletedTask;
    }

    public bool IsRedisActive => _isRedisConfigured;
}
