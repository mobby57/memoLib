using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public StatsController(MemoLibDbContext context)
    {
        _context = context;
    }

    private async Task<List<Guid>> GetUserSourceIdsAsync(Guid userId)
    {
        return await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();
    }

    private async Task<string?> GetUserEmailAsync(Guid userId)
    {
        return await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync();
    }

    [HttpGet("events-per-day")]
    public async Task<IActionResult> EventsPerDay()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await GetUserSourceIdsAsync(userId);
        var userEmail = (await GetUserEmailAsync(userId))?.Trim().ToLower();

        var query = _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId));

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            query = query.Where(e => e.RawPayload != null && e.RawPayload.ToLower().Contains(userEmail));
        }

        var result = await query
            .GroupBy(e => e.OccurredAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("events-by-type")]
    public async Task<IActionResult> EventsByType()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await GetUserSourceIdsAsync(userId);
        var userEmail = (await GetUserEmailAsync(userId))?.Trim().ToLower();

        var query = _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId));

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            query = query.Where(e => e.RawPayload != null && e.RawPayload.ToLower().Contains(userEmail));
        }

        var result = await query
            .GroupBy(e => e.EventType)
            .Select(g => new
            {
                Type = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("average-severity")]
    public async Task<IActionResult> AverageSeverity()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await GetUserSourceIdsAsync(userId);
        var userEmail = (await GetUserEmailAsync(userId))?.Trim().ToLower();

        var query = _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId));

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            query = query.Where(e => e.RawPayload != null && e.RawPayload.ToLower().Contains(userEmail));
        }

        var avg = await query
            .Where(e => e.Severity.HasValue)
            .Select(e => (double?)e.Severity!.Value)
            .AverageAsync() ?? 0d;

        return Ok(new { AverageSeverity = avg });
    }

    [HttpGet("top-sources")]
    public async Task<IActionResult> TopSources()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await GetUserSourceIdsAsync(userId);
        var userEmail = (await GetUserEmailAsync(userId))?.Trim().ToLower();

        var query = _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId));

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            query = query.Where(e => e.RawPayload != null && e.RawPayload.ToLower().Contains(userEmail));
        }

        var result = await query
            .GroupBy(e => e.SourceId)
            .Select(g => new
            {
                SourceId = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return Ok(result);
    }
}
