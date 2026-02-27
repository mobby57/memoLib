using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Authorization;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/cases")]
public class CaseController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public CaseController(MemoLibDbContext context)
    {
        _context = context;
    }

    private static string NormalizeCaseTitle(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "sans titre";

        var normalized = value.Trim().ToLowerInvariant();
        return System.Text.RegularExpressions.Regex.Replace(normalized, "\\s+", " ");
    }

    [Authorize(Policy = Policies.ViewCases)]
    [HttpGet]
    public async Task<IActionResult> ListCases()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        // MANAGER+ voit tous les dossiers
        var query = User.IsManagerOrAbove()
            ? _context.Cases
            : _context.Cases.Where(c => c.UserId == userId);

        var cases = await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.UserId,
                c.ClientId,
                c.Title,
                c.CreatedAt,
                FirstEvent = _context.CaseEvents
                    .Where(ce => ce.CaseId == c.Id)
                    .Join(_context.Events, ce => ce.EventId, e => e.Id, (ce, e) => e)
                    .OrderBy(e => e.OccurredAt)
                    .Select(e => new { e.RawPayload, e.OccurredAt })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(cases);
    }

    [Authorize(Policy = Policies.ViewCases)]
    [HttpGet("{caseId}")]
    public async Task<IActionResult> GetCase(Guid caseId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var c = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId);

        if (c == null)
            return NotFound("Case not found.");
            
        // Vérifier les permissions d'accès
        if (!c.UserId.HasValue || !User.CanAccessResource(c.UserId.Value))
            return Forbid();

        return Ok(c);
    }

    [Authorize(Policy = Policies.CreateCases)]
    [HttpPost]
    public async Task<IActionResult> CreateCase([FromBody] CreateCaseRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var c = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title,
            CreatedAt = DateTime.UtcNow
        };

        _context.Cases.Add(c);
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "CaseCreated",
            Metadata = c.Id.ToString(),
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(c.Id);
    }

    [HttpPost("{caseId}/events/{eventId}")]
    public async Task<IActionResult> AttachEvent(Guid caseId, Guid eventId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userOwnsCase = await _context.Cases
            .AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!userOwnsCase)
            return NotFound("Case not found.");

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var userOwnsEvent = await _context.Events
            .AnyAsync(e => e.Id == eventId && userSourceIds.Contains(e.SourceId));
        if (!userOwnsEvent)
            return NotFound("Event not found.");

        var exists = await _context.CaseEvents
            .AnyAsync(x => x.CaseId == caseId && x.EventId == eventId);

        if (exists)
            return Ok("Already linked.");

        _context.CaseEvents.Add(new CaseEvent
        {
            CaseId = caseId,
            EventId = eventId
        });

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "EventAttached",
            Metadata = $"{caseId}:{eventId}",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok("Linked.");
    }

    [HttpGet("{caseId}/timeline")]
    public async Task<IActionResult> GetTimeline(Guid caseId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userOwnsCase = await _context.Cases
            .AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!userOwnsCase)
            return NotFound("Case not found.");

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var events = await _context.CaseEvents
            .Where(ce => ce.CaseId == caseId)
            .Join(_context.Events,
                  ce => ce.EventId,
                  e => e.Id,
                  (ce, e) => e)
            .Where(e => userSourceIds.Contains(e.SourceId))
            .OrderBy(e => e.OccurredAt)
            .ToListAsync();

        return Ok(events);
    }

    [Authorize(Policy = Policies.DeleteCases)]
    [HttpPost("merge-duplicates")]
    public async Task<IActionResult> MergeDuplicateCases()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userCases = await _context.Cases
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var groups = userCases
            .GroupBy(c => $"{NormalizeCaseTitle(c.Title)}|{(c.ClientId?.ToString() ?? "SANS_CLIENT")}")
            .Where(g => g.Count() > 1)
            .ToList();

        if (groups.Count == 0)
        {
            return Ok(new
            {
                message = "Aucun doublon de dossier à fusionner",
                mergedGroups = 0,
                removedCases = 0,
                movedEvents = 0
            });
        }

        var mergedGroups = 0;
        var removedCases = 0;
        var movedEvents = 0;

        foreach (var group in groups)
        {
            var keeper = group
                .OrderByDescending(c => c.CreatedAt)
                .First();

            var duplicates = group
                .Where(c => c.Id != keeper.Id)
                .ToList();

            if (duplicates.Count == 0)
                continue;

            var duplicateIds = duplicates.Select(c => c.Id).ToList();

            var allLinks = await _context.CaseEvents
                .Where(ce => ce.CaseId == keeper.Id || duplicateIds.Contains(ce.CaseId))
                .ToListAsync();

            var keeperEventIds = allLinks
                .Where(ce => ce.CaseId == keeper.Id)
                .Select(ce => ce.EventId)
                .ToHashSet();

            var duplicateLinks = allLinks
                .Where(ce => duplicateIds.Contains(ce.CaseId))
                .ToList();

            foreach (var link in duplicateLinks)
            {
                if (keeperEventIds.Contains(link.EventId))
                    continue;

                _context.CaseEvents.Add(new CaseEvent
                {
                    CaseId = keeper.Id,
                    EventId = link.EventId
                });

                keeperEventIds.Add(link.EventId);
                movedEvents++;
            }

            if (duplicateLinks.Count > 0)
                _context.CaseEvents.RemoveRange(duplicateLinks);

            _context.Cases.RemoveRange(duplicates);

            removedCases += duplicates.Count;
            mergedGroups++;
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "CasesMerged",
            Metadata = $"groups={mergedGroups};removed={removedCases};movedEvents={movedEvents}",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Fusion intelligente terminée",
            mergedGroups,
            removedCases,
            movedEvents
        });
    }
}
