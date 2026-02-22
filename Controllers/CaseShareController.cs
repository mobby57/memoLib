using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/cases/{caseId}/shares")]
[Authorize]
public class CaseShareController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public CaseShareController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> ShareCase(Guid caseId, [FromBody] ShareCaseRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists) return NotFound(new { message = "Dossier introuvable" });

        var existing = await _context.CaseShares
            .FirstOrDefaultAsync(cs => cs.CaseId == caseId && cs.SharedWithEmail.ToLower() == request.Email.ToLower());

        if (existing != null)
        {
            return Conflict(new { message = "Dossier déjà partagé avec cette personne", shareId = existing.Id });
        }

        var share = new CaseShare
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            SharedWithEmail = request.Email,
            SharedWithName = request.Name,
            Role = request.Role ?? "VIEWER",
            SharedAt = DateTime.UtcNow,
            SharedByUserId = userId
        };

        _context.CaseShares.Add(share);
        await _context.SaveChangesAsync();

        return Ok(share);
    }

    [HttpGet]
    public async Task<IActionResult> GetShares(Guid caseId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists) return NotFound();

        var shares = await _context.CaseShares
            .Where(cs => cs.CaseId == caseId)
            .OrderByDescending(cs => cs.SharedAt)
            .ToListAsync();

        return Ok(shares);
    }

    [HttpDelete("{shareId}")]
    public async Task<IActionResult> RevokeShare(Guid caseId, Guid shareId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists) return NotFound();

        var share = await _context.CaseShares.FindAsync(shareId);
        if (share == null || share.CaseId != caseId) return NotFound();

        _context.CaseShares.Remove(share);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Partage révoqué" });
    }
}

public record ShareCaseRequest(string Email, string Name, string? Role);
