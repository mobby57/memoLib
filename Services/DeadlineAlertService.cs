using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class DeadlineAlertService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeadlineAlertService> _logger;

    public DeadlineAlertService(IServiceScopeFactory scopeFactory, ILogger<DeadlineAlertService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();
                await CheckDeadlineAlerts(db);
                await CheckHearingReminders(db);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur vérification alertes délais/audiences");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task CheckDeadlineAlerts(MemoLibDbContext db)
    {
        var deadlines = await db.LegalDeadlines
            .Where(d => !d.IsDeleted && d.Status != DeadlineStatus.Completed && d.Status != DeadlineStatus.Cancelled)
            .ToListAsync();

        foreach (var d in deadlines)
        {
            var remaining = (d.Deadline - DateTime.UtcNow).TotalDays;
            d.Status = LegalDeadlineService.ComputeStatus(d.Deadline);

            var alert = remaining switch
            {
                <= 1 when !d.AlertJ1Sent => (Flag: nameof(d.AlertJ1Sent), Label: "J-1"),
                <= 3 when !d.AlertJ3Sent => (Flag: nameof(d.AlertJ3Sent), Label: "J-3"),
                <= 7 when !d.AlertJ7Sent => (Flag: nameof(d.AlertJ7Sent), Label: "J-7"),
                <= 30 when !d.AlertJ30Sent => (Flag: nameof(d.AlertJ30Sent), Label: "J-30"),
                _ => default
            };

            if (alert.Label == null) continue;

            // Set the flag
            switch (alert.Flag)
            {
                case nameof(d.AlertJ1Sent): d.AlertJ1Sent = true; break;
                case nameof(d.AlertJ3Sent): d.AlertJ3Sent = true; break;
                case nameof(d.AlertJ7Sent): d.AlertJ7Sent = true; break;
                case nameof(d.AlertJ30Sent): d.AlertJ30Sent = true; break;
            }

            // Create notification
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = d.AssignedToUserId ?? d.TenantId,
                Title = $"⚠️ Délai {alert.Label}: {d.Title}",
                Message = $"Échéance le {d.Deadline:dd/MM/yyyy} - {d.Category}",
                Type = "deadline_alert",
                CreatedAt = DateTime.UtcNow
            });

            _logger.LogInformation("Alerte {Label} envoyée pour délai {Id}: {Title}", alert.Label, d.Id, d.Title);
        }

        await db.SaveChangesAsync();
    }

    private async Task CheckHearingReminders(MemoLibDbContext db)
    {
        var hearings = await db.Hearings
            .Where(h => !h.IsDeleted && h.Status != HearingStatus.Cancelled && h.Date >= DateTime.UtcNow)
            .ToListAsync();

        foreach (var h in hearings)
        {
            var remaining = (h.Date - DateTime.UtcNow).TotalDays;

            var send = remaining switch
            {
                <= 1 when !h.ReminderJ1Sent => "J-1",
                <= 7 when !h.ReminderJ7Sent => "J-7",
                _ => null
            };

            if (send == null) continue;

            if (send == "J-1") h.ReminderJ1Sent = true;
            else h.ReminderJ7Sent = true;

            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = h.AssignedToUserId ?? h.TenantId,
                Title = $"📅 Audience {send}: {h.Jurisdiction}",
                Message = $"Le {h.Date:dd/MM/yyyy} - {h.Type} - {h.Chamber ?? ""}",
                Type = "hearing_reminder",
                CreatedAt = DateTime.UtcNow
            });

            _logger.LogInformation("Rappel {Label} envoyé pour audience {Id}", send, h.Id);
        }

        await db.SaveChangesAsync();
    }
}
