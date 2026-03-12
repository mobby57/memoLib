using MemoLib.Api.Data;
using Serilog;

namespace MemoLib.Api.Services;

public class ConnectionMonitorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public ConnectionMonitorService(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalMinutes = _configuration.GetValue<int>("ConnectionMonitor:IntervalMinutes", 5);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();

                var canConnect = await db.Database.CanConnectAsync(stoppingToken);
                
                if (canConnect)
                {
                    Log.Information("✅ Database connection: OK");
                }
                else
                {
                    Log.Error("❌ Database connection: FAILED");
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "❌ Connection monitor error");
            }

            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
        }
    }
}
