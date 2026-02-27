using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/share")]
public class ExternalShareController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public ExternalShareController(MemoLibDbContext context) => _context = context;

    [HttpPost]
    public async Task<IActionResult> CreateShare([FromBody] ExternalShare share)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == share.CaseId && c.UserId == userId);
        if (!caseExists) return NotFound();

        share.SharedByUserId = userId;
        share.ShareToken = Guid.NewGuid().ToString("N");
        share.CreatedAt = DateTime.UtcNow;
        
        _context.ExternalShares.Add(share);
        await _context.SaveChangesAsync();

        var shareUrl = $"{Request.Scheme}://{Request.Host}/share/{share.ShareToken}";
        return Ok(new { share, shareUrl });
    }

    [HttpGet("{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> AccessShare(string token, [FromQuery] string? password)
    {
        var share = await _context.ExternalShares.FirstOrDefaultAsync(s => s.ShareToken == token);

        if (share == null) return NotFound("Share not found");
        if (share.ExpiresAt.HasValue && share.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Share has expired");

        if (!string.IsNullOrEmpty(share.Password))
        {
            if (string.IsNullOrEmpty(password) || !BCrypt.Net.BCrypt.Verify(password, share.Password))
                return Unauthorized("Invalid password");
        }

        share.AccessedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var documents = await _context.CaseDocuments
            .Where(d => share.DocumentIds.Contains(d.Id))
            .Select(d => new { d.Id, d.FileName, d.FileSize, d.ContentType })
            .ToListAsync();

        return Ok(new { share = new { share.CaseId, share.RecipientEmail, share.AllowDownload }, documents });
    }

    [HttpGet("{token}/document/{documentId}")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadDocument(string token, Guid documentId, [FromQuery] string? password)
    {
        var share = await _context.ExternalShares.FirstOrDefaultAsync(s => s.ShareToken == token);
        if (share == null) return NotFound();
        if (share.ExpiresAt.HasValue && share.ExpiresAt < DateTime.UtcNow) return BadRequest("Share expired");
        if (!share.AllowDownload) return Forbid();
        if (!share.DocumentIds.Contains(documentId)) return Forbid();

        if (!string.IsNullOrEmpty(share.Password))
        {
            if (string.IsNullOrEmpty(password) || !BCrypt.Net.BCrypt.Verify(password, share.Password))
                return Unauthorized();
        }

        var doc = await _context.CaseDocuments.FirstOrDefaultAsync(d => d.Id == documentId);
        if (doc == null || !System.IO.File.Exists(doc.FilePath)) return NotFound();

        var bytes = await System.IO.File.ReadAllBytesAsync(doc.FilePath);
        return File(bytes, doc.ContentType, doc.FileName);
    }

    [HttpGet("case/{caseId}")]
    public async Task<IActionResult> GetCaseShares(Guid caseId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists) return NotFound();

        var shares = await _context.ExternalShares
            .Where(s => s.CaseId == caseId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(shares);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RevokeShare(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var share = await _context.ExternalShares.FirstOrDefaultAsync(s => s.Id == id && s.SharedByUserId == userId);
        if (share == null) return NotFound();

        _context.ExternalShares.Remove(share);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
