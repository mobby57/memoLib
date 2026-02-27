using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Authorization;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public WebhooksController(MemoLibDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetWebhooks()
    {
        var userId = GetUserId();
        var webhooks = await _context.Webhooks
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return Ok(webhooks);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWebhook([FromBody] CreateWebhookRequest request)
    {
        var userId = GetUserId();

        var webhook = new Webhook
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Url = request.Url,
            Event = request.Event,
            Secret = Guid.NewGuid().ToString("N"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Webhooks.Add(webhook);
        await _context.SaveChangesAsync();

        return Ok(webhook);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWebhook(Guid id, [FromBody] UpdateWebhookRequest request)
    {
        var userId = GetUserId();
        var webhook = await _context.Webhooks.FindAsync(id);

        if (webhook == null || webhook.UserId != userId)
            return Forbid();

        webhook.Url = request.Url;
        webhook.Event = request.Event;
        webhook.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(webhook);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWebhook(Guid id)
    {
        var userId = GetUserId();
        var webhook = await _context.Webhooks.FindAsync(id);

        if (webhook == null || webhook.UserId != userId)
            return Forbid();

        _context.Webhooks.Remove(webhook);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Webhook supprimé" });
    }

    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetWebhookLogs(Guid id, [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var webhook = await _context.Webhooks.FindAsync(id);

        if (webhook == null || webhook.UserId != userId)
            return Forbid();

        var logs = await _context.WebhookLogs
            .Where(l => l.WebhookId == id)
            .OrderByDescending(l => l.TriggeredAt)
            .Take(limit)
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("events")]
    public IActionResult GetAvailableEvents()
    {
        return Ok(new[]
        {
            "CASE_CREATED",
            "CASE_UPDATED",
            "CASE_CLOSED",
            "MESSAGE_RECEIVED",
            "COMMENT_ADDED",
            "DOCUMENT_UPLOADED",
            "STATUS_CHANGED",
            "PRIORITY_CHANGED",
            "TASK_COMPLETED",
            "INVOICE_CREATED",
            "INVOICE_PAID"
        });
    }
}

public record CreateWebhookRequest(string Url, string Event);
public record UpdateWebhookRequest(string Url, string Event, bool IsActive);
