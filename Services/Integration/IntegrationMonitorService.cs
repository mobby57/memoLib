using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace MemoLib.Api.Services.Integration;

public interface IIntegrationMonitorService
{
    Task<IntegrationHealth> CheckHealthAsync(string integration);
    Task<Dictionary<string, IntegrationHealth>> CheckAllHealthAsync();
    Task RecordMetricAsync(string integration, string metric, double value);
}

public class IntegrationHealth
{
    public string Name { get; set; } = string.Empty;
    public HealthStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public TimeSpan ResponseTime { get; set; }
    public DateTime LastCheck { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}

public class IntegrationMonitorService : IIntegrationMonitorService
{
    private readonly ILogger<IntegrationMonitorService> _logger;
    private readonly IEmailAdapter _emailAdapter;
    private readonly Dictionary<string, IntegrationHealth> _healthCache = new();

    public IntegrationMonitorService(
        ILogger<IntegrationMonitorService> logger,
        IEmailAdapter emailAdapter)
    {
        _logger = logger;
        _emailAdapter = emailAdapter;
    }

    public async Task<IntegrationHealth> CheckHealthAsync(string integration)
    {
        var startTime = DateTime.UtcNow;
        var health = new IntegrationHealth
        {
            Name = integration,
            LastCheck = startTime
        };

        try
        {
            var isHealthy = integration switch
            {
                "gmail" => await _emailAdapter.TestConnectionAsync(),
                "api" => await CheckApiHealthAsync(),
                "database" => await CheckDatabaseHealthAsync(),
                _ => false
            };

            health.Status = isHealthy ? HealthStatus.Healthy : HealthStatus.Unhealthy;
            health.Description = isHealthy ? "Service is healthy" : "Service is unhealthy";
            health.ResponseTime = DateTime.UtcNow - startTime;

            _healthCache[integration] = health;
            
            if (!isHealthy)
            {
                _logger.LogWarning("Integration {Integration} is unhealthy", integration);
            }
        }
        catch (Exception ex)
        {
            health.Status = HealthStatus.Unhealthy;
            health.Description = ex.Message;
            health.ResponseTime = DateTime.UtcNow - startTime;
            
            _logger.LogError(ex, "Health check failed for {Integration}", integration);
        }

        return health;
    }

    public async Task<Dictionary<string, IntegrationHealth>> CheckAllHealthAsync()
    {
        var integrations = new[] { "gmail", "api", "database" };
        var results = new Dictionary<string, IntegrationHealth>();

        var tasks = integrations.Select(async integration =>
        {
            var health = await CheckHealthAsync(integration);
            return new { Integration = integration, Health = health };
        });

        var healthResults = await Task.WhenAll(tasks);
        
        foreach (var result in healthResults)
        {
            results[result.Integration] = result.Health;
        }

        return results;
    }

    public Task RecordMetricAsync(string integration, string metric, double value)
    {
        _logger.LogInformation("Metric recorded: {Integration}.{Metric} = {Value}", 
            integration, metric, value);
        
        if (_healthCache.TryGetValue(integration, out var health))
        {
            health.Data[metric] = value;
        }

        return Task.CompletedTask;
    }

    private async Task<bool> CheckApiHealthAsync()
    {
        // Simulate API health check
        await Task.Delay(10);
        return true;
    }

    private async Task<bool> CheckDatabaseHealthAsync()
    {
        // Simulate database health check
        await Task.Delay(20);
        return true;
    }
}

public class IntegrationHealthCheck : IHealthCheck
{
    private readonly IIntegrationMonitorService _monitorService;
    private readonly string _integrationName;

    public IntegrationHealthCheck(IIntegrationMonitorService monitorService, string integrationName)
    {
        _monitorService = monitorService;
        _integrationName = integrationName;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var health = await _monitorService.CheckHealthAsync(_integrationName);
        
        return health.Status switch
        {
            HealthStatus.Healthy => HealthCheckResult.Healthy(health.Description, health.Data),
            HealthStatus.Degraded => HealthCheckResult.Degraded(health.Description, data: health.Data),
            _ => HealthCheckResult.Unhealthy(health.Description, data: health.Data)
        };
    }
}