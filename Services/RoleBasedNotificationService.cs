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

    // Notification : Nouvel email reçu
    public async Task NotifyNewEmailReceived(int caseId, string userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        // Alerter les secrétaires (doivent traiter)
        await CreateNotificationsForRole(userId, UserRole.SECRETARY, 
            "📧 Nouvel email reçu", 
            $"Email de {clientName} - Dossier #{caseId}", 
            "NEW_EMAIL", caseId, "HIGH");

        // Alerter les associés (supervision)
        await CreateNotificationsForRole(userId, UserRole.PARTNER, 
            "📬 Nouvel email", 
            $"Email de {clientName}", 
            "NEW_EMAIL", caseId, "LOW");
    }

    // Notification : Dossier assigné
    public async Task NotifyAssignedToLawyer(int caseId, int assignedToUserId, string assignedByUserId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        var lawyer = await _context.Users.FindAsync(assignedToUserId);
        if (@case == null || lawyer == null) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        // Alerter l'avocat assigné (doit traiter)
        await CreateNotification(assignedToUserId.ToString(), 
            "⚖️ Dossier assigné à vous", 
            $"Dossier #{caseId} - {clientName} - Priorité: {@case.Priority}", 
            "CASE_ASSIGNED", caseId, "HIGH");

        // Alerter les associés (supervision)
        await CreateNotificationsForRole(assignedByUserId, UserRole.PARTNER, 
            "👤 Dossier assigné", 
            $"{(lawyer.Name ?? lawyer.Email)} → Dossier #{caseId}", 
            "CASE_ASSIGNED", caseId, "LOW");
    }

    // Notification : Priorité (1=urgent, 5=faible)
    public async Task NotifyHighPriority(int caseId, string userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null || @case.Priority > 2) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        var priorityLabel = @case.Priority == 1 ? "CRITIQUE" : "ÉLEVÉE";
        var severity = @case.Priority == 1 ? "CRITICAL" : "HIGH";

        // Alerter l'avocat assigné
        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value.ToString(), 
                $"🚨 URGENT - Priorité {priorityLabel} ({@case.Priority}/5)", 
                $"Dossier #{caseId} - {clientName}", 
                "HIGH_PRIORITY", caseId, severity);
        }

        // Alerter tous les associés/partenaires
        await CreateNotificationsForRole(userId, UserRole.PARTNER, 
            $"⚠️ Dossier prioritaire ({@case.Priority}/5)", 
            $"Dossier #{caseId} - {clientName}", 
            "HIGH_PRIORITY", caseId, severity);

        await CreateNotificationsForRole(userId, UserRole.OWNER, 
            $"⚠️ Dossier prioritaire ({@case.Priority}/5)", 
            $"Dossier #{caseId} - {clientName}", 
            "HIGH_PRIORITY", caseId, severity);
    }

    // Notification : Échéance proche
    public async Task NotifyDeadlineApproaching(int caseId, string userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null || !@case.DueDate.HasValue) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        var daysLeft = (@case.DueDate.Value - DateTime.UtcNow).Days;
        if (daysLeft > 3) return;

        // Alerter l'avocat assigné
        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value.ToString(), 
                $"⏰ Échéance dans {daysLeft} jours", 
                $"Dossier #{caseId} - {clientName}", 
                "DEADLINE_APPROACHING", caseId, "HIGH");
        }

        // Alerter les associés
        await CreateNotificationsForRole(userId, UserRole.PARTNER, 
            $"📅 Échéance proche ({daysLeft}j)", 
            $"Dossier #{caseId}", 
            "DEADLINE_APPROACHING", caseId, "MEDIUM");
    }

    // Notification : Statut changé
    public async Task NotifyStatusChanged(int caseId, string oldStatus, string newStatus, string userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null) return;
        var clientName = await GetClientDisplayNameAsync(@case);

        // Alerter l'avocat assigné
        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value.ToString(), 
                $"📊 Statut: {oldStatus} → {newStatus}", 
                $"Dossier #{caseId} - {clientName}", 
                "STATUS_CHANGED", caseId, "MEDIUM");
        }

        // Si clôturé, alerter les associés
        if (newStatus == "CLOSED")
        {
            await CreateNotificationsForRole(userId, UserRole.PARTNER, 
                "✅ Dossier clôturé", 
                $"Dossier #{caseId} - {clientName}", 
                "CASE_CLOSED", caseId, "LOW");
        }
    }

    // Notification : Anomalie détectée
    public async Task NotifyAnomaly(string anomalyType, string description, int? caseId, string userId)
    {
        // Alerter tous les associés et propriétaires
        await CreateNotificationsForRole(userId, UserRole.PARTNER, 
            $"⚠️ Anomalie: {anomalyType}", 
            description, 
            "ANOMALY", caseId, "HIGH");

        await CreateNotificationsForRole(userId, UserRole.OWNER, 
            $"⚠️ Anomalie: {anomalyType}", 
            description, 
            "ANOMALY", caseId, "HIGH");
    }

    // Notification : Nouveau commentaire
    public async Task NotifyNewComment(int caseId, string commentAuthor, string userId)
    {
        var @case = await _context.Cases.FindAsync(caseId);
        if (@case == null) return;

        // Alerter l'avocat assigné (si ce n'est pas lui qui a commenté)
        if (@case.AssignedToUserId.HasValue)
        {
            await CreateNotification(@case.AssignedToUserId.Value.ToString(), 
                "💬 Nouveau commentaire", 
                $"{commentAuthor} a commenté le dossier #{caseId}", 
                "NEW_COMMENT", caseId, "LOW");
        }
    }

    // Créer notification pour un rôle spécifique
    private async Task CreateNotificationsForRole(string excludeUserId, UserRole role, string title, string message, string type, int? caseId, string severity)
    {
        var users = await _context.UserTeamMemberships
            .Where(ut => ut.Role == role && ut.UserId.ToString() != excludeUserId)
            .Select(ut => ut.UserId)
            .ToListAsync();

        foreach (var userId in users)
        {
            await CreateNotification(userId.ToString(), title, message, type, caseId, severity);
        }
    }

    // Créer une notification
    private async Task CreateNotification(string userId, string title, string message, string type, int? caseId, string severity)
    {
        var notification = new RoleNotification
        {
            UserId = int.Parse(userId),
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

        _logger.LogInformation($"Notification créée: {title} pour user {userId}");
    }

    // Récupérer notifications non lues
    public async Task<List<RoleNotification>> GetUnreadNotifications(int userId)
    {
        return await _context.RoleNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    // Marquer comme lu
    public async Task MarkAsRead(int notificationId, int userId)
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

    // Marquer toutes comme lues
    public async Task MarkAllAsRead(int userId)
    {
        var notifications = await _context.RoleNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    // Compter notifications non lues
    public async Task<int> CountUnread(int userId)
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
