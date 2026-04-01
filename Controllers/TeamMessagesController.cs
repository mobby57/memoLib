using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/messages")]
public class TeamMessagesController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public TeamMessagesController(MemoLibDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetMessages([FromQuery] Guid? toUserId, [FromQuery] Guid? caseId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var query = _context.TeamMessages.Where(m => m.FromUserId == userId || m.ToUserId == userId);

        if (toUserId.HasValue)
            query = query.Where(m => (m.FromUserId == userId && m.ToUserId == toUserId) || 
                                    (m.FromUserId == toUserId && m.ToUserId == userId));
        
        if (caseId.HasValue)
            query = query.Where(m => m.CaseId == caseId);

        var messages = await query.OrderBy(m => m.SentAt).ToListAsync();
        return Ok(messages);
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] TeamMessage message)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        message.FromUserId = userId;
        message.SentAt = DateTime.UtcNow;
        
        _context.TeamMessages.Add(message);
        await _context.SaveChangesAsync();
        return Ok(message);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var message = await _context.TeamMessages.FirstOrDefaultAsync(m => m.Id == id && m.ToUserId == userId);
        if (message == null) return NotFound();

        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(message);
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var count = await _context.TeamMessages.CountAsync(m => m.ToUserId == userId && !m.IsRead);
        return Ok(new { count });
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        
        var conversations = await _context.TeamMessages
            .Where(m => m.FromUserId == userId || m.ToUserId == userId)
            .GroupBy(m => m.FromUserId == userId ? m.ToUserId : m.FromUserId)
            .Select(g => new
            {
                UserId = g.Key,
                LastMessage = g.OrderByDescending(m => m.SentAt).First(),
                UnreadCount = g.Count(m => m.ToUserId == userId && !m.IsRead)
            })
            .ToListAsync();

        return Ok(conversations);
    }
}
