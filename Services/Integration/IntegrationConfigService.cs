using Microsoft.Extensions.Options;

namespace MemoLib.Api.Services.Integration;

public interface IIntegrationConfigService
{
    Task<T> GetConfigAsync<T>(string integration, string key) where T : class;
    Task SetConfigAsync<T>(string integration, string key, T value) where T : class;
    Task<bool> IsIntegrationEnabledAsync(string integration);
    Task<IntegrationSettings> GetIntegrationSettingsAsync(string integration);
    Task UpdateIntegrationSettingsAsync(string integration, IntegrationSettings settings);
}

public class IntegrationSettings
{
    public bool Enabled { get; set; } = true;
    public int MaxRetries { get; set; } = 3;
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(30);
    public Dictionary<string, object> CustomSettings { get; set; } = new();
    public RateLimitSettings RateLimit { get; set; } = new();
}

public class RateLimitSettings
{
    public int MaxRequests { get; set; } = 100;
    public TimeSpan Window { get; set; } = TimeSpan.FromMinutes(1);
    public string Strategy { get; set; } = "SlidingWindow";
}

public class IntegrationConfigService : IIntegrationConfigService
{
    private readonly ICacheService _cacheService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IntegrationConfigService> _logger;
    private readonly Dictionary<string, IntegrationSettings> _defaultSettings;

    public IntegrationConfigService(
        ICacheService cacheService,
        IConfiguration configuration,
        ILogger<IntegrationConfigService> logger)
    {
        _cacheService = cacheService;
        _configuration = configuration;
        _logger = logger;
        _defaultSettings = InitializeDefaultSettings();
    }

    public async Task<T> GetConfigAsync<T>(string integration, string key) where T : class
    {
        var cacheKey = $"integration_config:{integration}:{key}";

        // Try cache first
        var cached = await _cacheService.GetAsync<T>(cacheKey);
        if (cached != null) return cached;

        // Try configuration
        var configValue = _configuration[$"Integrations:{integration}:{key}"];
        if (!string.IsNullOrEmpty(configValue))
        {
            try
            {
                var deserialized = System.Text.Json.JsonSerializer.Deserialize<T>(configValue);
                if (deserialized != null)
                {
                    await _cacheService.SetAsync(cacheKey, deserialized, TimeSpan.FromMinutes(10));
                    return deserialized;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize config for {Integration}.{Key}", integration, key);
            }
        }

        // Return default if available
        if (_defaultSettings.TryGetValue(integration, out var settings) &&
            settings.CustomSettings.TryGetValue(key, out var defaultValue) &&
            defaultValue is T typedValue)
        {
            return typedValue;
        }

        return null!;
    }

    public async Task SetConfigAsync<T>(string integration, string key, T value) where T : class
    {
        var cacheKey = $"integration_config:{integration}:{key}";
        await _cacheService.SetAsync(cacheKey, value, TimeSpan.FromMinutes(10));
        
        _logger.LogInformation("Configuration updated for {Integration}.{Key}", integration, key);
    }

    public async Task<bool> IsIntegrationEnabledAsync(string integration)
    {
        var settings = await GetIntegrationSettingsAsync(integration);
        return settings.Enabled;
    }

    public async Task<IntegrationSettings> GetIntegrationSettingsAsync(string integration)
    {
        var cacheKey = $"integration_settings:{integration}";
        
        return await _cacheService.GetOrSetAsync(cacheKey, () =>
        {
            // Try to load from configuration
            var configSection = _configuration.GetSection($"Integrations:{integration}");
            if (configSection.Exists())
            {
                var settings = new IntegrationSettings();
                configSection.Bind(settings);
                return Task.FromResult(settings);
            }

            // Return default settings
            return Task.FromResult(_defaultSettings.GetValueOrDefault(integration, new IntegrationSettings()));
        }, TimeSpan.FromMinutes(5));
    }

    public async Task UpdateIntegrationSettingsAsync(string integration, IntegrationSettings settings)
    {
        var cacheKey = $"integration_settings:{integration}";
        await _cacheService.SetAsync(cacheKey, settings, TimeSpan.FromMinutes(5));
        
        _logger.LogInformation("Integration settings updated for {Integration}", integration);
    }

    private Dictionary<string, IntegrationSettings> InitializeDefaultSettings()
    {
        return new Dictionary<string, IntegrationSettings>
        {
            ["gmail"] = new IntegrationSettings
            {
                Enabled = true,
                MaxRetries = 3,
                Timeout = TimeSpan.FromSeconds(30),
                RateLimit = new RateLimitSettings
                {
                    MaxRequests = 100,
                    Window = TimeSpan.FromMinutes(1),
                    Strategy = "SlidingWindow"
                },
                CustomSettings = new Dictionary<string, object>
                {
                    ["BatchSize"] = 20,
                    ["MaxConcurrentConnections"] = 5,
                    ["CacheTimeout"] = "00:02:00"
                }
            },
            ["outlook"] = new IntegrationSettings
            {
                Enabled = true,
                MaxRetries = 3,
                Timeout = TimeSpan.FromSeconds(45),
                RateLimit = new RateLimitSettings
                {
                    MaxRequests = 50,
                    Window = TimeSpan.FromMinutes(1),
                    Strategy = "TokenBucket"
                }
            },
            ["docusign"] = new IntegrationSettings
            {
                Enabled = true,
                MaxRetries = 5,
                Timeout = TimeSpan.FromMinutes(2),
                RateLimit = new RateLimitSettings
                {
                    MaxRequests = 20,
                    Window = TimeSpan.FromMinutes(1),
                    Strategy = "FixedWindow"
                }
            },
            ["openai"] = new IntegrationSettings
            {
                Enabled = true,
                MaxRetries = 3,
                Timeout = TimeSpan.FromMinutes(1),
                RateLimit = new RateLimitSettings
                {
                    MaxRequests = 60,
                    Window = TimeSpan.FromMinutes(1),
                    Strategy = "SlidingWindow"
                },
                CustomSettings = new Dictionary<string, object>
                {
                    ["Model"] = "gpt-3.5-turbo",
                    ["MaxTokens"] = 1000,
                    ["Temperature"] = 0.7
                }
            },
            ["legifrance"] = new IntegrationSettings
            {
                Enabled = true,
                MaxRetries = 2,
                Timeout = TimeSpan.FromSeconds(15),
                RateLimit = new RateLimitSettings
                {
                    MaxRequests = 30,
                    Window = TimeSpan.FromMinutes(1),
                    Strategy = "FixedWindow"
                }
            },
            ["notifications"] = new IntegrationSettings
            {
                Enabled = true,
                MaxRetries = 3,
                Timeout = TimeSpan.FromSeconds(10),
                RateLimit = new RateLimitSettings
                {
                    MaxRequests = 200,
                    Window = TimeSpan.FromMinutes(1),
                    Strategy = "TokenBucket"
                },
                CustomSettings = new Dictionary<string, object>
                {
                    ["BatchSize"] = 10,
                    ["RetryDelay"] = "00:00:30"
                }
            }
        };
    }
}

public static class IntegrationConfigExtensions
{
    public static async Task<T?> GetCustomSettingAsync<T>(this IIntegrationConfigService configService, 
        string integration, string key, T? defaultValue = default)
    {
        try
        {
            var settings = await configService.GetIntegrationSettingsAsync(integration);
            if (settings.CustomSettings.TryGetValue(key, out var value))
            {
                if (value is T typedValue)
                    return typedValue;
                
                // Try to convert
                if (typeof(T) == typeof(TimeSpan) && value is string timeSpanString)
                {
                    if (TimeSpan.TryParse(timeSpanString, out var timeSpan))
                        return (T)(object)timeSpan;
                }
                
                if (typeof(T) == typeof(int) && value is long longValue)
                {
                    return (T)(object)(int)longValue;
                }
            }
        }
        catch (Exception)
        {
            // Return default on any error
        }
        
        return defaultValue;
    }
}