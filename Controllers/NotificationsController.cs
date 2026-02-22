using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public NotificationsController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool? unreadOnly = false)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost("{id}/mark-read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
            return NotFound();

        notification.IsRead = true;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "NotificationRead",
            Metadata = System.Text.Json.JsonSerializer.Serialize(new {
                notificationId = id,
                title = notification.Title
            }),
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification marquée comme lue" });
    }

    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> ResolveNotification(Guid id, [FromBody] ResolveRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
            return NotFound();

        notification.IsResolved = true;
        notification.Resolution = request.Resolution;
        notification.ResolvedAt = DateTime.UtcNow;
        notification.IsRead = true;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "NotificationResolved",
            Metadata = System.Text.Json.JsonSerializer.Serialize(new {
                notificationId = id,
                title = notification.Title,
                resolution = request.Resolution,
                action = request.Action
            }),
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification résolue", resolution = request.Resolution, action = request.Action });
    }

    [HttpPost("{id}/dismiss")]
    public async Task<IActionResult> DismissNotification(Guid id, [FromBody] DismissRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
            return NotFound();

        notification.IsResolved = true;
        notification.Resolution = request.Reason ?? "Notification ignorée par l'utilisateur";
        notification.ResolvedAt = DateTime.UtcNow;
        notification.IsRead = true;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "NotificationDismissed",
            Metadata = System.Text.Json.JsonSerializer.Serialize(new {
                notificationId = id,
                title = notification.Title,
                reason = request.Reason
            }),
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification ignorée" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
            return NotFound();

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "NotificationDeleted",
            Metadata = System.Text.Json.JsonSerializer.Serialize(new {
                notificationId = id,
                title = notification.Title,
                type = notification.Type,
                wasResolved = notification.IsResolved
            }),
            OccurredAt = DateTime.UtcNow
        });

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification supprimée" });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var count = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();

        return Ok(new { count });
    }
}

public class ResolveRequest
{
    public string Resolution { get; set; } = null!;
    public string? Action { get; set; }
}

public class DismissRequest
{
    public string? Reason { get; set; }
}
