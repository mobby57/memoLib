using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/deadlines")]
public class LegalDeadlinesController : ControllerBase
{
    private readonly LegalDeadlineService _svc;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public LegalDeadlinesController(LegalDeadlineService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetByCaseAsync(Guid caseId) =>
        Ok(await _svc.GetByCaseAsync(caseId));

    [HttpGet("/api/deadlines/upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int days = 30) =>
        Ok(await _svc.GetUpcomingAsync(UserId, days));

    [HttpPost]
    public async Task<IActionResult> Create(Guid caseId, [FromBody] CreateDeadlineRequest req)
    {
        var d = new LegalDeadline
        {
            CaseId = caseId,
            AssignedToUserId = req.AssignedToUserId,
            Title = req.Title,
            Description = req.Description,
            Category = req.Category,
            Deadline = req.Deadline,
            Jurisdiction = req.Jurisdiction,
            LegalBasis = req.LegalBasis,
            Notes = req.Notes,
            TenantId = UserId
        };
        var created = await _svc.CreateAsync(d);
        return Ok(created);
    }

    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> Complete(Guid id)
    {
        var d = await _svc.CompleteAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDeadlineRequest req)
    {
        var d = await _svc.UpdateAsync(id, d =>
        {
            if (req.Title != null) d.Title = req.Title;
            if (req.Description != null) d.Description = req.Description;
            if (req.Category.HasValue) d.Category = req.Category.Value;
            if (req.Deadline.HasValue) d.Deadline = req.Deadline.Value;
            if (req.AssignedToUserId.HasValue) d.AssignedToUserId = req.AssignedToUserId;
            if (req.Jurisdiction != null) d.Jurisdiction = req.Jurisdiction;
            if (req.LegalBasis != null) d.LegalBasis = req.LegalBasis;
            if (req.Notes != null) d.Notes = req.Notes;
        });
        return d == null ? NotFound() : Ok(d);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await _svc.DeleteAsync(id) ? NoContent() : NotFound();
}

public record CreateDeadlineRequest(
    string Title,
    DateTime Deadline,
    DeadlineCategory Category = DeadlineCategory.Custom,
    string? Description = null,
    Guid? AssignedToUserId = null,
    string? Jurisdiction = null,
    string? LegalBasis = null,
    string? Notes = null);

public record UpdateDeadlineRequest(
    string? Title = null,
    DateTime? Deadline = null,
    DeadlineCategory? Category = null,
    string? Description = null,
    Guid? AssignedToUserId = null,
    string? Jurisdiction = null,
    string? LegalBasis = null,
    string? Notes = null);
