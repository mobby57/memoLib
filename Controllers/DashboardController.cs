using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using System.Text.Json;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public DashboardController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var cases = await _context.Cases
            .Where(c => c.UserId == userId)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.ClientId,
                c.CreatedAt,
                EventCount = _context.CaseEvents.Count(ce => ce.CaseId == c.Id),
                FirstEvent = _context.CaseEvents
                    .Where(ce => ce.CaseId == c.Id)
                    .Join(_context.Events, ce => ce.EventId, e => e.Id, (ce, e) => new
                    {
                        e.RawPayload,
                        e.OccurredAt,
                        e.ExternalId
                    })
                    .OrderBy(e => e.OccurredAt)
                    .FirstOrDefault()
            })
            .OrderByDescending(c => c.CreatedAt)
            .Take(100)
            .ToListAsync();

        var enrichedCases = cases.Select(c =>
        {
            string from = "N/A";
            string subject = c.Title;
            
            if (c.FirstEvent?.RawPayload != null)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(c.FirstEvent.RawPayload);
                    if (payload != null)
                    {
                        if (payload.TryGetValue("from", out var f)) from = f?.ToString() ?? "N/A";
                        else if (payload.TryGetValue("From", out var F)) from = F?.ToString() ?? "N/A";
                    }
                }
                catch { }
            }

            return new
            {
                c.Id,
                c.Title,
                c.ClientId,
                c.CreatedAt,
                c.EventCount,
                From = from,
                OccurredAt = c.FirstEvent?.OccurredAt,
                ExternalId = c.FirstEvent?.ExternalId
            };
        }).ToList();

        var clients = await _context.Clients
            .Where(cl => cl.UserId == userId)
            .Select(cl => new
            {
                cl.Id,
                cl.Name,
                cl.Email,
                cl.PhoneNumber,
                cl.Address,
                cl.CreatedAt,
                CasesCount = _context.Cases.Count(c => c.ClientId == cl.Id)
            })
            .OrderByDescending(cl => cl.CreatedAt)
            .ToListAsync();

        var events = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId))
            .OrderByDescending(e => e.OccurredAt)
            .Take(50)
            .Select(e => new
            {
                e.Id,
                e.ExternalId,
                e.OccurredAt,
                e.RawPayload,
                e.RequiresAttention,
                e.ValidationFlags
            })
            .ToListAsync();

        var enrichedEvents = events.Select(e =>
        {
            string from = "N/A";
            string subject = "N/A";
            
            if (e.RawPayload != null)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(e.RawPayload);
                    if (payload != null)
                    {
                        if (payload.TryGetValue("from", out var f)) from = f?.ToString() ?? "N/A";
                        else if (payload.TryGetValue("From", out var F)) from = F?.ToString() ?? "N/A";
                        
                        if (payload.TryGetValue("subject", out var s)) subject = s?.ToString() ?? "N/A";
                        else if (payload.TryGetValue("Subject", out var S)) subject = S?.ToString() ?? "N/A";
                    }
                }
                catch { }
            }

            return new
            {
                e.Id,
                e.ExternalId,
                e.OccurredAt,
                From = from,
                Subject = subject,
                e.RequiresAttention,
                e.ValidationFlags
            };
        }).ToList();

        var stats = new
        {
            TotalCases = cases.Count,
            TotalClients = clients.Count,
            TotalEvents = await _context.Events.Where(e => userSourceIds.Contains(e.SourceId)).CountAsync(),
            EventsWithAnomalies = await _context.Events.Where(e => userSourceIds.Contains(e.SourceId) && e.RequiresAttention).CountAsync(),
            UnreadNotifications = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead)
        };

        return Ok(new
        {
            stats,
            cases = enrichedCases,
            clients,
            recentEvents = enrichedEvents
        });
    }
}
