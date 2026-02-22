using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AlertsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public AlertsController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("center")]
    public async Task<IActionResult> GetAnomalyCenter([FromQuery] int limit = 30)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        limit = Math.Clamp(limit, 5, 200);

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var eventAnomaliesRaw = await _context.Events
            .AsNoTracking()
            .Where(e => userSourceIds.Contains(e.SourceId) && e.RequiresAttention)
            .OrderByDescending(e => e.IngestedAt)
            .Select(e => new
            {
                id = e.Id,
                occurredAt = e.OccurredAt,
                createdAt = e.IngestedAt,
                externalId = e.ExternalId,
                title = e.EventType ?? "event",
                details = e.ValidationFlags
            })
            .Take(limit)
            .ToListAsync();

        var notificationAnomaliesRaw = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .Where(n => !n.IsResolved || !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                id = n.Id,
                occurredAt = n.CreatedAt,
                createdAt = n.CreatedAt,
                externalId = (string?)null,
                title = n.Title,
                details = n.Message
            })
            .Take(limit)
            .ToListAsync();

        var eventAnomalies = eventAnomaliesRaw
            .Select(e => new CenterItem(
                "EVENT",
                e.id,
                e.occurredAt,
                e.createdAt,
                e.externalId,
                e.title,
                e.details,
                "DELETE_EVENT"))
            .ToList();

        var notificationAnomalies = notificationAnomaliesRaw
            .Select(n => new CenterItem(
                "NOTIFICATION",
                n.id,
                n.occurredAt,
                n.createdAt,
                n.externalId,
                n.title,
                n.details,
                "RESOLVE_OR_DISMISS"))
            .ToList();

        var logs = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.OccurredAt)
            .Take(limit)
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.Metadata,
                a.OccurredAt
            })
            .ToListAsync();

        var groupedFlags = eventAnomalies
            .SelectMany(e => (e.Details ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .GroupBy(flag => flag)
            .Select(g => new { flag = g.Key, count = g.Count() })
            .OrderByDescending(g => g.count)
            .ToList();

        return Ok(new
        {
            summary = new
            {
                totalEventAnomalies = eventAnomalies.Count,
                totalNotificationAnomalies = notificationAnomalies.Count,
                totalOpenAnomalies = eventAnomalies.Count + notificationAnomalies.Count,
                totalRecentLogs = logs.Count
            },
            groupedFlags,
            items = eventAnomalies
                .Concat(notificationAnomalies)
                .OrderByDescending(x => x.CreatedAt)
                .Take(limit)
                .ToList(),
            logs,
            directActions = new
            {
                deleteEventEndpoint = "/api/events/{eventId}",
                dismissNotificationEndpoint = "/api/notifications/{notificationId}/dismiss",
                resolveNotificationEndpoint = "/api/notifications/{notificationId}/resolve"
            }
        });
    }

    [HttpGet("requires-attention")]
    public async Task<IActionResult> GetRequiresAttention()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var events = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId) && e.RequiresAttention)
            .OrderByDescending(e => e.IngestedAt)
            .Select(e => new
            {
                e.Id,
                e.ExternalId,
                e.OccurredAt,
                e.IngestedAt,
                e.RawPayload,
                e.ValidationFlags,
                e.RequiresAttention
            })
            .ToListAsync();

        return Ok(new
        {
            count = events.Count,
            events
        });
    }
}

public record CenterItem(
    string Kind,
    Guid Id,
    DateTime OccurredAt,
    DateTime CreatedAt,
    string? ExternalId,
    string Title,
    string? Details,
    string Action);
