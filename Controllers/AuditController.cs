using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public AuditController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("user-actions")]
    public async Task<IActionResult> GetUserActions([FromQuery] int limit = 50)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var actions = await _context.AuditLogs
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

        return Ok(new { count = actions.Count, actions });
    }

    [HttpGet("notification-actions")]
    public async Task<IActionResult> GetNotificationActions([FromQuery] int limit = 50)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var actions = await _context.AuditLogs
            .Where(a => a.UserId == userId && 
                   (a.Action == "NotificationRead" || 
                    a.Action == "NotificationDismissed" || 
                    a.Action == "NotificationResolved" || 
                    a.Action == "NotificationDeleted"))
            .OrderByDescending(a => a.OccurredAt)
            .Take(limit)
            .ToListAsync();

        return Ok(new { count = actions.Count, actions });
    }
}
