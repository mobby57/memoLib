using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/hearings")]
public class HearingsController : ControllerBase
{
    private readonly HearingService _svc;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public HearingsController(HearingService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetByCaseAsync(Guid caseId) =>
        Ok(await _svc.GetByCaseAsync(caseId));

    [HttpGet("/api/hearings/upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int days = 30) =>
        Ok(await _svc.GetUpcomingAsync(UserId, days));

    [HttpPost]
    public async Task<IActionResult> Create(Guid caseId, [FromBody] CreateHearingRequest req)
    {
        var h = new Hearing
        {
            CaseId = caseId,
            AssignedToUserId = req.AssignedToUserId,
            Date = req.Date,
            StartTime = req.StartTime,
            Duration = req.Duration,
            Jurisdiction = req.Jurisdiction,
            Chamber = req.Chamber,
            RoleNumber = req.RoleNumber,
            CourtAddress = req.CourtAddress,
            Type = req.Type,
            OpposingParty = req.OpposingParty,
            OpposingLawyer = req.OpposingLawyer,
            JudgeName = req.JudgeName,
            DocumentsToProvide = req.DocumentsToProvide,
            Notes = req.Notes,
            TenantId = UserId
        };
        var created = await _svc.CreateAsync(h);
        return Ok(created);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateHearingStatusRequest req)
    {
        var h = await _svc.UpdateStatusAsync(id, req.Status, req.Outcome);
        return h == null ? NotFound() : Ok(h);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHearingRequest req)
    {
        var h = await _svc.UpdateAsync(id, h =>
        {
            if (req.Date.HasValue) h.Date = req.Date.Value;
            if (req.StartTime.HasValue) h.StartTime = req.StartTime;
            if (req.Duration != null) h.Duration = req.Duration;
            if (req.Jurisdiction != null) h.Jurisdiction = req.Jurisdiction;
            if (req.Chamber != null) h.Chamber = req.Chamber;
            if (req.RoleNumber != null) h.RoleNumber = req.RoleNumber;
            if (req.CourtAddress != null) h.CourtAddress = req.CourtAddress;
            if (req.Type.HasValue) h.Type = req.Type.Value;
            if (req.OpposingParty != null) h.OpposingParty = req.OpposingParty;
            if (req.OpposingLawyer != null) h.OpposingLawyer = req.OpposingLawyer;
            if (req.JudgeName != null) h.JudgeName = req.JudgeName;
            if (req.DocumentsToProvide != null) h.DocumentsToProvide = req.DocumentsToProvide;
            if (req.Notes != null) h.Notes = req.Notes;
        });
        return h == null ? NotFound() : Ok(h);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await _svc.DeleteAsync(id) ? NoContent() : NotFound();
}

public record CreateHearingRequest(
    DateTime Date,
    string Jurisdiction,
    HearingType Type = HearingType.Audience,
    TimeSpan? StartTime = null,
    string? Duration = null,
    string? Chamber = null,
    string? RoleNumber = null,
    string? CourtAddress = null,
    Guid? AssignedToUserId = null,
    string? OpposingParty = null,
    string? OpposingLawyer = null,
    string? JudgeName = null,
    string? DocumentsToProvide = null,
    string? Notes = null);

public record UpdateHearingRequest(
    DateTime? Date = null,
    TimeSpan? StartTime = null,
    string? Duration = null,
    string? Jurisdiction = null,
    string? Chamber = null,
    string? RoleNumber = null,
    string? CourtAddress = null,
    HearingType? Type = null,
    Guid? AssignedToUserId = null,
    string? OpposingParty = null,
    string? OpposingLawyer = null,
    string? JudgeName = null,
    string? DocumentsToProvide = null,
    string? Notes = null);

public record UpdateHearingStatusRequest(HearingStatus Status, string? Outcome = null);
