using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/cases")]
[Authorize]
public class CaseManagementController : ControllerBase
{
    private readonly MemoLibDbContext _db;
    private readonly SatisfactionSurveyService _surveyService;

    public CaseManagementController(MemoLibDbContext db, SatisfactionSurveyService surveyService)
    {
        _db = db;
        _surveyService = surveyService;
    }

    [HttpPatch("{caseId}/status")]
    public async Task<IActionResult> UpdateStatus(Guid caseId, [FromBody] CaseStatusUpdateRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == caseId && x.UserId == userId);
        if (c == null) return NotFound();

        var wasClosed = c.Status == "CLOSED";
        c.Status = req.Status;
        if (req.Status == "CLOSED" && !wasClosed)
        {
            c.ClosedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            
            // Envoyer automatiquement l'enquête de satisfaction
            await _surveyService.SendSurveyOnCaseClosureAsync(caseId);
        }
        else
        {
            await _db.SaveChangesAsync();
        }
        
        return Ok(c);
    }

    [HttpPatch("{caseId}/assign")]
    public async Task<IActionResult> AssignCase(Guid caseId, [FromBody] AssignRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == caseId && x.UserId == userId);
        if (c == null) return NotFound();

        c.AssignedToUserId = req.AssignedToUserId;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPatch("{caseId}/tags")]
    public async Task<IActionResult> UpdateTags(Guid caseId, [FromBody] TagsRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == caseId && x.UserId == userId);
        if (c == null) return NotFound();

        c.Tags = string.Join(",", req.Tags);
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPatch("{caseId}/priority")]
    public async Task<IActionResult> UpdatePriority(Guid caseId, [FromBody] PriorityRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == caseId && x.UserId == userId);
        if (c == null) return NotFound();

        c.Priority = req.Priority;
        c.DueDate = req.DueDate;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpGet("filter")]
    public IActionResult FilterCases([FromQuery] string? status, [FromQuery] string? tag, [FromQuery] int? priority)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var query = _db.Cases.Where(c => c.UserId == userId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrEmpty(tag))
            query = query.Where(c => c.Tags != null && c.Tags.Contains(tag));

        if (priority.HasValue)
            query = query.Where(c => c.Priority == priority.Value);

        return Ok(query.OrderByDescending(c => c.CreatedAt).ToList());
    }
}

public record CaseStatusUpdateRequest(string Status);
public record AssignRequest(Guid? AssignedToUserId);
public record TagsRequest(string[] Tags);
public record PriorityRequest(int Priority, DateTime? DueDate);
