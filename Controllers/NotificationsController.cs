using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using System.Security.Claims;

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

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId.Value && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(new { notifications, count = notifications.Count });
    }

    [HttpGet("count")]
    public async Task<IActionResult> GetCount()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var count = await _context.Notifications
            .CountAsync(n => n.UserId == userId.Value && !n.IsRead);

        return Ok(new { count });
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId.Value);

        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification marquée comme lue" });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var unread = await _context.Notifications
            .Where(n => n.UserId == userId.Value && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread) n.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Toutes les notifications marquées comme lues" });
    }
}
