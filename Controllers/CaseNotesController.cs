using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/notes")]
public class CaseNotesController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<CaseNotesController> _logger;

    public CaseNotesController(MemoLibDbContext context, ILogger<CaseNotesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/cases/{caseId}/notes
    [HttpGet]
    public async Task<ActionResult<List<CaseNote>>> GetNotes(Guid caseId)
    {
        var userId = GetCurrentUserId();

        // Vérifier accès au dossier
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists)
            return NotFound("Dossier non trouvé");

        var notes = await _context.CaseNotes
            .Where(n => n.CaseId == caseId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notes);
    }

    // POST /api/cases/{caseId}/notes
    [HttpPost]
    public async Task<ActionResult<CaseNote>> CreateNote(Guid caseId, [FromBody] CreateNoteRequest request)
    {
        var userId = GetCurrentUserId();

        // Vérifier accès au dossier
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists)
            return NotFound("Dossier non trouvé");

        var note = new CaseNote
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            Content = request.Content,
            Visibility = request.Visibility ?? "private",
            AuthorId = userId,
            Mentions = request.Mentions,
            CreatedAt = DateTime.UtcNow
        };

        _context.CaseNotes.Add(note);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Note créée: {NoteId} sur dossier {CaseId}", note.Id, caseId);

        return CreatedAtAction(nameof(GetNote), new { caseId, noteId = note.Id }, note);
    }

    // GET /api/cases/{caseId}/notes/{noteId}
    [HttpGet("{noteId}")]
    public async Task<ActionResult<CaseNote>> GetNote(Guid caseId, Guid noteId)
    {
        var userId = GetCurrentUserId();

        var note = await _context.CaseNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CaseId == caseId);

        if (note == null)
            return NotFound();

        // Vérifier accès au dossier
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists)
            return Forbid();

        return Ok(note);
    }

    // PUT /api/cases/{caseId}/notes/{noteId}
    [HttpPut("{noteId}")]
    public async Task<IActionResult> UpdateNote(Guid caseId, Guid noteId, [FromBody] UpdateNoteRequest request)
    {
        var userId = GetCurrentUserId();

        var note = await _context.CaseNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CaseId == caseId);

        if (note == null)
            return NotFound();

        // Seul l'auteur peut modifier
        if (note.AuthorId != userId)
            return Forbid();

        note.Content = request.Content ?? note.Content;
        note.Visibility = request.Visibility ?? note.Visibility;
        note.Mentions = request.Mentions ?? note.Mentions;
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Note mise à jour: {NoteId}", noteId);

        return NoContent();
    }

    // DELETE /api/cases/{caseId}/notes/{noteId}
    [HttpDelete("{noteId}")]
    public async Task<IActionResult> DeleteNote(Guid caseId, Guid noteId)
    {
        var userId = GetCurrentUserId();

        var note = await _context.CaseNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CaseId == caseId);

        if (note == null)
            return NotFound();

        // Seul l'auteur peut supprimer
        if (note.AuthorId != userId)
            return Forbid();

        _context.CaseNotes.Remove(note);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Note supprimée: {NoteId}", noteId);

        return NoContent();
    }
}

public record CreateNoteRequest(string Content, string? Visibility, string? Mentions);
public record UpdateNoteRequest(string? Content, string? Visibility, string? Mentions);
