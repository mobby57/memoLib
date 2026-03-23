using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class AutomationEngineService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AutomationEngineService> _logger;
    private readonly IConfiguration _config;

    public AutomationEngineService(
        IServiceProvider serviceProvider,
        ILogger<AutomationEngineService> logger,
        IConfiguration config)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var enabled = _config.GetValue<bool>("Automations:EngineEnabled", true);
        if (!enabled)
        {
            _logger.LogInformation("Automation engine désactivé");
            return;
        }

        var intervalSeconds = _config.GetValue<int>("Automations:CheckIntervalSeconds", 30);
        _logger.LogInformation("🤖 Automation engine démarré (intervalle: {Interval}s)", intervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EvaluateTriggersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur dans le moteur d'automation");
            }

            await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
        }
    }

    private async Task EvaluateTriggersAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();
        var workflowService = scope.ServiceProvider.GetRequiredService<WorkflowAutomationService>();

        var automations = await context.Automations
            .Where(a => a.IsActive)
            .ToListAsync(ct);

        foreach (var automation in automations)
        {
            try
            {
                var matchingCases = await FindMatchingCases(context, automation, ct);

                foreach (var caseId in matchingCases)
                {
                    await workflowService.ExecuteWorkflowAsync(caseId, automation.TriggerType, automation.UserId);
                    _logger.LogInformation("⚡ Automation '{Name}' exécutée sur dossier {CaseId}",
                        automation.Name, caseId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur automation {AutomationId}: {Name}", automation.Id, automation.Name);
            }
        }
    }

    private static async Task<List<Guid>> FindMatchingCases(
        MemoLibDbContext context, Automation automation, CancellationToken ct)
    {
        var query = context.Cases.Where(c => c.UserId == automation.UserId && c.Status != "CLOSED");

        switch (automation.TriggerType)
        {
            case "DUE_DATE_APPROACHING":
                var daysThreshold = automation.TriggerConditions.TryGetValue("daysBeforeDue", out var days)
                    && int.TryParse(days, out var d) ? d : 3;
                var threshold = DateTime.UtcNow.AddDays(daysThreshold);
                query = query.Where(c => c.DueDate.HasValue && c.DueDate.Value <= threshold && c.DueDate.Value >= DateTime.UtcNow);
                break;

            case "DUE_DATE_PASSED":
                query = query.Where(c => c.DueDate.HasValue && c.DueDate.Value < DateTime.UtcNow);
                break;

            case "HIGH_PRIORITY_NO_ASSIGNMENT":
                var minPriority = automation.TriggerConditions.TryGetValue("minPriority", out var mp)
                    && int.TryParse(mp, out var minP) ? minP : 4;
                query = query.Where(c => c.Priority >= minPriority && c.AssignedToUserId == null);
                break;

            case "STALE_CASE":
                var staleDays = automation.TriggerConditions.TryGetValue("staleDays", out var sd)
                    && int.TryParse(sd, out var stale) ? stale : 7;
                var staleDate = DateTime.UtcNow.AddDays(-staleDays);
                query = query.Where(c => c.Status == "OPEN" && c.UpdatedAt < staleDate);
                break;

            case "NO_ACTIVITY":
                var inactiveDays = automation.TriggerConditions.TryGetValue("inactiveDays", out var id)
                    && int.TryParse(id, out var inactive) ? inactive : 5;
                var inactiveDate = DateTime.UtcNow.AddDays(-inactiveDays);
                var activeCaseIds = await context.CaseActivities
                    .Where(a => a.OccurredAt >= inactiveDate)
                    .Select(a => a.CaseId)
                    .Distinct()
                    .ToListAsync(ct);
                query = query.Where(c => !activeCaseIds.Contains(c.Id));
                break;

            default:
                return new List<Guid>();
        }

        return await query.Select(c => c.Id).Take(50).ToListAsync(ct);
    }
}
