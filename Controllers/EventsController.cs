using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;
using MemoLib.Api.Data;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Models;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly EventService _eventService;
    private readonly MemoLibDbContext _context;

    public EventsController(EventService eventService, MemoLibDbContext context)
    {
        _eventService = eventService;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Ingest([FromBody] IngestRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var result = await _eventService.IngestEventAsync(
            userId, request.SourceId, request.ExternalId, request.OccurredAt, request.Payload);

        if (!result.Success)
            return result.Message.Contains("not owned") ? Forbid() : Ok(result.Message);

        return Ok(new
        {
            message = result.Message,
            eventId = result.EventId,
            caseId = result.CaseId,
            caseCreated = result.CaseCreated
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var ev = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && userSourceIds.Contains(e.SourceId));

        if (ev is null)
            return NotFound(new { message = "Event introuvable" });

        var links = await _context.CaseEvents
            .Where(ce => ce.EventId == id)
            .ToListAsync();

        if (links.Count > 0)
            _context.CaseEvents.RemoveRange(links);

        _context.Events.Remove(ev);

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "EventDeleted",
            Metadata = id.ToString(),
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Event supprimé", eventId = id });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEventById(Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var ev = await _context.Events
            .AsNoTracking()
            .Where(e => e.Id == id && userSourceIds.Contains(e.SourceId))
            .Select(e => new
            {
                e.Id,
                e.ExternalId,
                e.SourceId,
                e.OccurredAt,
                e.IngestedAt,
                e.RawPayload,
                e.ValidationFlags,
                e.RequiresAttention,
                e.EventType,
                e.Severity,
                e.TextForEmbedding
            })
            .FirstOrDefaultAsync();

        if (ev is null)
            return NotFound(new { message = "Event introuvable" });

        return Ok(ev);
    }

    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDeleteByAnomaly([FromBody] BulkDeleteEventsRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        if (string.IsNullOrWhiteSpace(request.ValidationFlag))
            return BadRequest(new { message = "ValidationFlag requis" });

        var maxToDelete = request.MaxToDelete <= 0 ? 200 : Math.Min(request.MaxToDelete, 1000);
        var normalizedFlag = request.ValidationFlag.Trim().ToUpperInvariant();

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var candidates = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId) && e.RequiresAttention)
            .Where(e => e.ValidationFlags != null && e.ValidationFlags.ToUpper().Contains(normalizedFlag))
            .OrderByDescending(e => e.IngestedAt)
            .Take(maxToDelete)
            .ToListAsync();

        if (candidates.Count == 0)
        {
            return Ok(new
            {
                message = "Aucun événement à supprimer",
                deletedCount = 0,
                validationFlag = normalizedFlag
            });
        }

        var eventIds = candidates.Select(e => e.Id).ToList();
        var links = await _context.CaseEvents
            .Where(ce => eventIds.Contains(ce.EventId))
            .ToListAsync();

        if (links.Count > 0)
            _context.CaseEvents.RemoveRange(links);

        _context.Events.RemoveRange(candidates);

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "EventsBulkDeleted",
            Metadata = $"flag={normalizedFlag};count={candidates.Count}",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Suppression groupée effectuée",
            deletedCount = candidates.Count,
            validationFlag = normalizedFlag
        });
    }

    [HttpPost("bulk-delete-attention")]
    public async Task<IActionResult> BulkDeleteAttentionEvents([FromBody] BulkDeleteAttentionRequest? request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var maxToDelete = request?.MaxToDelete is > 0
            ? Math.Min(request.MaxToDelete.Value, 5000)
            : 5000;

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var excludedFlag = string.IsNullOrWhiteSpace(request?.ExcludedValidationFlag)
            ? null
            : request!.ExcludedValidationFlag!.Trim().ToUpperInvariant();

        var candidates = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId) && e.RequiresAttention)
            .OrderByDescending(e => e.IngestedAt)
            .Take(maxToDelete)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(excludedFlag))
        {
            candidates = candidates
                .Where(e =>
                {
                    var flags = (e.ValidationFlags ?? string.Empty)
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Select(f => f.ToUpperInvariant());

                    return !flags.Contains(excludedFlag!);
                })
                .ToList();
        }

        if (candidates.Count == 0)
        {
            return Ok(new
            {
                message = "Aucun événement nécessitant attention à supprimer",
                deletedCount = 0,
                excludedValidationFlag = excludedFlag
            });
        }

        var eventIds = candidates.Select(e => e.Id).ToList();
        var links = await _context.CaseEvents
            .Where(ce => eventIds.Contains(ce.EventId))
            .ToListAsync();

        if (links.Count > 0)
            _context.CaseEvents.RemoveRange(links);

        _context.Events.RemoveRange(candidates);

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "EventsAttentionBulkDeleted",
            Metadata = $"count={candidates.Count};exclude={excludedFlag ?? "NONE"}",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Suppression en masse des événements nécessitant attention effectuée",
            deletedCount = candidates.Count,
            excludedValidationFlag = excludedFlag
        });
    }
}

public record IngestRequest(Guid SourceId, string ExternalId, DateTime OccurredAt, string Payload);
public record BulkDeleteEventsRequest(string ValidationFlag, int MaxToDelete = 200);
public record BulkDeleteAttentionRequest(int? MaxToDelete = 5000, string? ExcludedValidationFlag = null);
