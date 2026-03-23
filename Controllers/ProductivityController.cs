using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/productivity")]
public class ProductivityController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public ProductivityController(MemoLibDbContext context) => _context = context;

    /// <summary>
    /// Briefing quotidien : tout ce que l'avocat doit savoir en ouvrant MemoLib
    /// </summary>
    [HttpGet("daily-briefing")]
    public async Task<IActionResult> GetDailyBriefing()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var today = DateTime.Today;
        var now = DateTime.UtcNow;

        // Dossiers en retard (échéance dépassée, pas fermés)
        var overdueCases = await _context.Cases
            .Where(c => c.UserId == userId && c.DueDate < today && c.Status != "CLOSED")
            .OrderBy(c => c.DueDate)
            .Select(c => new { c.Id, c.Title, c.DueDate, c.Priority, c.Status, DaysOverdue = (today - c.DueDate!.Value).Days })
            .Take(10)
            .ToListAsync();

        // Dossiers dont l'échéance est dans les 3 prochains jours
        var upcomingDeadlines = await _context.Cases
            .Where(c => c.UserId == userId && c.DueDate >= today && c.DueDate <= today.AddDays(3) && c.Status != "CLOSED")
            .OrderBy(c => c.DueDate)
            .Select(c => new { c.Id, c.Title, c.DueDate, c.Priority })
            .Take(10)
            .ToListAsync();

        // Tâches dues aujourd'hui
        var tasksDueToday = await _context.CaseTasks
            .Where(t => _context.Cases.Any(c => c.Id == t.CaseId && c.UserId == userId)
                && !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value.Date == today)
            .Select(t => new { t.Id, t.Title, t.Priority, t.CaseId })
            .ToListAsync();

        // Tâches en retard
        var overdueTasks = await _context.CaseTasks
            .Where(t => _context.Cases.Any(c => c.Id == t.CaseId && c.UserId == userId)
                && !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value.Date < today)
            .Select(t => new { t.Id, t.Title, t.Priority, t.CaseId, t.DueDate })
            .Take(10)
            .ToListAsync();

        // Notifications non lues
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        // Emails reçus aujourd'hui
        var emailsToday = await _context.Events
            .CountAsync(e => e.OccurredAt >= today && e.EventType == "email");

        // Emails nécessitant attention
        var attentionEmails = await _context.Events
            .Where(e => e.RequiresAttention == true && e.EventType == "email")
            .OrderByDescending(e => e.OccurredAt)
            .Select(e => new { e.Id, e.ExternalId, e.OccurredAt, e.ValidationFlags })
            .Take(5)
            .ToListAsync();

        // Résumé charge de travail
        var openCases = await _context.Cases.CountAsync(c => c.UserId == userId && c.Status == "OPEN");
        var inProgressCases = await _context.Cases.CountAsync(c => c.UserId == userId && c.Status == "IN_PROGRESS");

        // Suggestions intelligentes
        var suggestions = new List<string>();
        if (overdueCases.Count > 0)
            suggestions.Add($"⚠️ {overdueCases.Count} dossier(s) en retard — à traiter en priorité");
        if (unreadCount > 5)
            suggestions.Add($"📬 {unreadCount} notifications non lues — consultez votre centre de notifications");
        if (attentionEmails.Count > 0)
            suggestions.Add($"🔍 {attentionEmails.Count} email(s) avec anomalie à vérifier");
        if (tasksDueToday.Count > 0)
            suggestions.Add($"✅ {tasksDueToday.Count} tâche(s) à terminer aujourd'hui");
        if (openCases > 10)
            suggestions.Add($"📁 {openCases} dossiers ouverts — pensez à clôturer les dossiers terminés");
        if (suggestions.Count == 0)
            suggestions.Add("🎉 Tout est à jour — bonne journée !");

        return Ok(new
        {
            date = today,
            workload = new { openCases, inProgressCases, totalActive = openCases + inProgressCases },
            overdueCases,
            upcomingDeadlines,
            tasksDueToday,
            overdueTasks,
            emails = new { today = emailsToday, attentionRequired = attentionEmails },
            unreadNotifications = unreadCount,
            suggestions
        });
    }

    /// <summary>
    /// Résumé hebdomadaire de productivité
    /// </summary>
    [HttpGet("weekly-summary")]
    public async Task<IActionResult> GetWeeklySummary()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var weekStart = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek + 1);
        var weekEnd = weekStart.AddDays(7);

        var casesCreated = await _context.Cases
            .CountAsync(c => c.UserId == userId && c.CreatedAt >= weekStart && c.CreatedAt < weekEnd);

        var casesClosed = await _context.Cases
            .CountAsync(c => c.UserId == userId && c.ClosedAt >= weekStart && c.ClosedAt < weekEnd);

        var tasksCompleted = await _context.CaseTasks
            .CountAsync(t => _context.Cases.Any(c => c.Id == t.CaseId && c.UserId == userId)
                && t.IsCompleted && t.CompletedAt >= weekStart && t.CompletedAt < weekEnd);

        var emailsReceived = await _context.Events
            .CountAsync(e => e.OccurredAt >= weekStart && e.OccurredAt < weekEnd && e.EventType == "email");

        var timeLogged = await _context.TimeEntries
            .Where(t => t.UserId == userId && t.StartTime >= weekStart && t.StartTime < weekEnd)
            .SumAsync(t => t.Duration);

        var revenueThisWeek = await _context.TimeEntries
            .Where(t => t.UserId == userId && t.StartTime >= weekStart && t.StartTime < weekEnd)
            .SumAsync(t => t.Amount);

        return Ok(new
        {
            period = new { start = weekStart, end = weekEnd.AddDays(-1) },
            casesCreated,
            casesClosed,
            tasksCompleted,
            emailsReceived,
            timeLoggedHours = Math.Round(timeLogged, 1),
            revenueGenerated = Math.Round(revenueThisWeek, 2),
            efficiency = casesClosed > 0 && casesCreated > 0
                ? $"{Math.Round((double)casesClosed / casesCreated * 100)}% de résolution"
                : "N/A"
        });
    }
}
