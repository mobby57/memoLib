using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class RoleBasedNotificationService
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<RoleBasedNotificationService> _logger;

    public RoleBasedNotificationService(MemoLibDbContext context, ILogger<RoleBasedNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task NotifyNewEmailReceived(Guid caseId, Guid userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        await CreateNotificationsForRole(userId, UserRole.SECRETARY,
            "📧 Nouvel email reçu",
            $"Email de {clientName} - Dossier {caseId}",
            "NEW_EMAIL", caseId, "HIGH");

        await CreateNotificationsForRole(userId, UserRole.PARTNER,
            "📬 Nouvel email",
            $"Email de {clientName}",
            "NEW_EMAIL", caseId, "LOW");
    }

    public async Task NotifyAssignedToLawyer(Guid caseId, Guid assignedToUserId, Guid assignedByUserId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        var lawyer = await _context.Users.FindAsync(assignedToUserId);
        if (@case == null || lawyer == null) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        await CreateNotification(assignedToUserId,
            "⚖️ Dossier assigné à vous",
            $"Dossier {caseId} - {clientName} - Priorité: {@case.Priority}",
            "CASE_ASSIGNED", caseId, "HIGH");

        await CreateNotificationsForRole(assignedByUserId, UserRole.PARTNER,
            "👤 Dossier assigné",
            $"{(lawyer.Name ?? lawyer.Email)} → Dossier {caseId}",
            "CASE_ASSIGNED", caseId, "LOW");
    }

    public async Task NotifyHighPriority(Guid caseId, Guid userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null || @case.Priority > 2) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        var priorityLabel = @case.Priority == 1 ? "CRITIQUE" : "ÉLEVÉE";
        var severity = @case.Priority == 1 ? "CRITICAL" : "HIGH";

        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value,
                $"🚨 URGENT - Priorité {priorityLabel} ({@case.Priority}/5)",
                $"Dossier {caseId} - {clientName}",
                "HIGH_PRIORITY", caseId, severity);
        }

        await CreateNotificationsForRole(userId, UserRole.PARTNER,
            $"⚠️ Dossier prioritaire ({@case.Priority}/5)",
            $"Dossier {caseId} - {clientName}",
            "HIGH_PRIORITY", caseId, severity);

        await CreateNotificationsForRole(userId, UserRole.OWNER,
            $"⚠️ Dossier prioritaire ({@case.Priority}/5)",
            $"Dossier {caseId} - {clientName}",
            "HIGH_PRIORITY", caseId, severity);
    }

    public async Task NotifyDeadlineApproaching(Guid caseId, Guid userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null || !@case.DueDate.HasValue) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        var daysLeft = (@case.DueDate.Value - DateTime.UtcNow).Days;
        if (daysLeft > 3) return;

        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value,
                $"⏰ Échéance dans {daysLeft} jours",
                $"Dossier {caseId} - {clientName}",
                "DEADLINE_APPROACHING", caseId, "HIGH");
        }

        await CreateNotificationsForRole(userId, UserRole.PARTNER,
            $"📅 Échéance proche ({daysLeft}j)",
            $"Dossier {caseId}",
            "DEADLINE_APPROACHING", caseId, "MEDIUM");
    }

    public async Task NotifyStatusChanged(Guid caseId, string oldStatus, string newStatus, Guid userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value,
                $"📊 Statut: {oldStatus} → {newStatus}",
                $"Dossier {caseId} - {clientName}",
                "STATUS_CHANGED", caseId, "MEDIUM");
        }

        if (newStatus == "CLOSED")
        {
            await CreateNotificationsForRole(userId, UserRole.PARTNER,
                "✅ Dossier clôturé",
                $"Dossier {caseId} - {clientName}",
                "CASE_CLOSED", caseId, "LOW");
        }
    }

    public async Task NotifyAnomaly(string anomalyType, string description, Guid? caseId, Guid userId)
    {
        await CreateNotificationsForRole(userId, UserRole.PARTNER,
            $"⚠️ Anomalie: {anomalyType}",
            description,
            "ANOMALY", caseId, "HIGH");

        await CreateNotificationsForRole(userId, UserRole.OWNER,
            $"⚠️ Anomalie: {anomalyType}",
            description,
            "ANOMALY", caseId, "HIGH");
    }

    public async Task NotifyNewComment(Guid caseId, string commentAuthor, Guid userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null) return;

        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value,
                "💬 Nouveau commentaire",
                $"{commentAuthor} a commenté le dossier {caseId}",
                "NEW_COMMENT", caseId, "LOW");
        }
    }

    private async Task CreateNotificationsForRole(Guid excludeUserId, UserRole role, string title, string message, string type, Guid? caseId, string severity)
    {
        var userIds = await _context.UserTeamMemberships
            .Where(ut => ut.Role == role && ut.UserId != excludeUserId)
            .Select(ut => ut.UserId)
            .ToListAsync();

        foreach (var uid in userIds)
            await CreateNotification(uid, title, message, type, caseId, severity);
    }

    private async Task CreateNotification(Guid userId, string title, string message, string type, Guid? caseId, string severity)
    {
        var notification = new RoleNotification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            CaseId = caseId,
            Severity = severity,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RoleNotifications.Add(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Notification créée: {Title} pour user {UserId}", title, userId);
    }

    public async Task<List<RoleNotification>> GetUnreadNotifications(Guid userId)
    {
        return await _context.RoleNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task MarkAsRead(Guid notificationId, Guid userId)
    {
        var notification = await _context.RoleNotifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsRead(Guid userId)
    {
        var notifications = await _context.RoleNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in notifications)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<int> CountUnread(Guid userId)
    {
        return await _context.RoleNotifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    private async Task<string> GetClientDisplayNameAsync(Case @case)
    {
        if (!@case.ClientId.HasValue)
            return "Client";

        var client = await _context.Clients.FindAsync(@case.ClientId.Value);
        return client?.Name ?? "Client";
    }
}
