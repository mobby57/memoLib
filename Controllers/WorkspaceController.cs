using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/workspace")]
public class WorkspaceController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly IntelligentWorkspaceOrganizerService _organizer;

    public WorkspaceController(MemoLibDbContext context, IntelligentWorkspaceOrganizerService organizer)
    {
        _context = context;
        _organizer = organizer;
    }

    [HttpGet("organized")]
    public async Task<IActionResult> GetOrganizedWorkspaces()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var workspaces = await _context.Cases
            .Where(c => c.UserId == userId)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Tags,
                c.Priority,
                c.Status,
                c.CreatedAt,
                c.ClientId,
                EmailCount = _context.CaseEvents.Count(ce => ce.CaseId == c.Id)
            })
            .OrderByDescending(c => c.Priority)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync();

        var grouped = workspaces
            .GroupBy(w => w.Tags?.Split(',').FirstOrDefault() ?? "general")
            .ToDictionary(g => g.Key, g => g.ToList());

        return Ok(new { workspaces = grouped, total = workspaces.Count });
    }

    [HttpPost("{workspaceId}/merge/{targetWorkspaceId}")]
    public async Task<IActionResult> MergeWorkspaces(Guid workspaceId, Guid targetWorkspaceId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var source = await _context.Cases.FirstOrDefaultAsync(c => c.Id == workspaceId && c.UserId == userId);
        var target = await _context.Cases.FirstOrDefaultAsync(c => c.Id == targetWorkspaceId && c.UserId == userId);

        if (source == null || target == null)
            return NotFound();

        // Déplacer tous les événements vers le workspace cible
        var events = await _context.CaseEvents.Where(ce => ce.CaseId == workspaceId).ToListAsync();
        foreach (var evt in events)
            evt.CaseId = targetWorkspaceId;

        // Fusionner les tags
        var sourceTags = source.Tags?.Split(',') ?? Array.Empty<string>();
        var targetTags = target.Tags?.Split(',') ?? Array.Empty<string>();
        var mergedTags = sourceTags.Union(targetTags).Distinct().ToArray();
        target.Tags = string.Join(",", mergedTags);

        // Supprimer le workspace source
        _context.Cases.Remove(source);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Workspaces fusionnés", targetWorkspaceId, eventsCount = events.Count });
    }

    [HttpPost("reorganize")]
    public async Task<IActionResult> ReorganizeAll()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var cases = await _context.Cases
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var reorganized = 0;
        foreach (var case_ in cases)
        {
            if (case_.ClientId != null)
            {
                var client = await _context.Clients.FindAsync(case_.ClientId);
                if (client?.Email != null)
                {
                    var newWorkspaceId = await _organizer.GetOrCreateWorkspaceAsync(
                        userId, client.Email, case_.Title, "");
                    
                    _context.Cases.Remove(case_);
                    reorganized++;
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"{reorganized} workspaces réorganisés" });
    }
}