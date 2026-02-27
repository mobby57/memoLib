using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/calls")]
public class PhoneCallsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public PhoneCallsController(MemoLibDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetCalls(Guid caseId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists) return NotFound();

        var calls = await _context.PhoneCalls
            .Where(c => c.CaseId == caseId)
            .OrderByDescending(c => c.StartTime)
            .ToListAsync();
        return Ok(calls);
    }

    [HttpPost]
    public async Task<IActionResult> LogCall(Guid caseId, [FromBody] PhoneCall call)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists) return NotFound();

        call.CaseId = caseId;
        call.HandledByUserId = userId;
        if (call.EndTime.HasValue)
            call.DurationSeconds = (int)(call.EndTime.Value - call.StartTime).TotalSeconds;

        _context.PhoneCalls.Add(call);
        await _context.SaveChangesAsync();
        return Ok(call);
    }

    [HttpPatch("{id}/end")]
    public async Task<IActionResult> EndCall(Guid caseId, Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var call = await _context.PhoneCalls.FirstOrDefaultAsync(c => c.Id == id && c.CaseId == caseId);
        if (call == null) return NotFound();

        call.EndTime = DateTime.UtcNow;
        call.DurationSeconds = (int)(call.EndTime.Value - call.StartTime).TotalSeconds;
        await _context.SaveChangesAsync();
        return Ok(call);
    }

    [HttpPatch("{id}/transcription")]
    public async Task<IActionResult> UpdateTranscription(Guid caseId, Guid id, [FromBody] string transcription)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var call = await _context.PhoneCalls.FirstOrDefaultAsync(c => c.Id == id && c.CaseId == caseId);
        if (call == null) return NotFound();

        call.Transcription = transcription;
        await _context.SaveChangesAsync();
        return Ok(call);
    }
}
