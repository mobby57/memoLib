using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/notes")]
public class CaseNotesController : ControllerBase
{
    private readonly CaseNotesService _notesService;

    public CaseNotesController(CaseNotesService notesService)
    {
        _notesService = notesService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotes(Guid caseId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var notes = await _notesService.GetNotesAsync(caseId, userId);
            return Ok(notes);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateNote(Guid caseId, [FromBody] CreateCaseNoteRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Le contenu de la note est obligatoire" });
        }

        try
        {
            var note = await _notesService.CreateNoteAsync(caseId, userId, request.Content.Trim(), request.IsPrivate, request.Mentions);
            return Ok(note);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNote(Guid caseId, Guid id, [FromBody] UpdateCaseNoteRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Le contenu de la note est obligatoire" });
        }

        var note = await _notesService.UpdateNoteAsync(caseId, id, userId, request.Content.Trim(), request.IsPrivate, request.Mentions);
        if (note == null)
        {
            return NotFound(new { message = "Note introuvable" });
        }

        return Ok(note);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNote(Guid caseId, Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var deleted = await _notesService.DeleteNoteAsync(caseId, id, userId);
        if (!deleted)
        {
            return NotFound(new { message = "Note introuvable" });
        }

        return NoContent();
    }
}

public sealed record CreateCaseNoteRequest(string Content, bool IsPrivate = false, List<string>? Mentions = null);
public sealed record UpdateCaseNoteRequest(string Content, bool IsPrivate = false, List<string>? Mentions = null);
