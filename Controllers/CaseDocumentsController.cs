using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/documents")]
public class CaseDocumentsController : ControllerBase
{
    private readonly CaseDocumentsService _documentsService;

    public CaseDocumentsController(CaseDocumentsService documentsService)
    {
        _documentsService = documentsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocuments(Guid caseId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var documents = await _documentsService.GetDocumentsAsync(caseId, userId);
            return Ok(documents);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> UploadDocument(Guid caseId, IFormFile file, [FromForm] string? category, [FromForm] string? tags)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var parsedTags = string.IsNullOrWhiteSpace(tags)
                ? Array.Empty<string>()
                : tags.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

            var document = await _documentsService.UploadDocumentAsync(caseId, userId, file, category, parsedTags);
            return Ok(document);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadDocument(Guid caseId, Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var (document, fileBytes) = await _documentsService.DownloadDocumentAsync(caseId, id, userId);
            if (document == null || fileBytes == null)
            {
                return NotFound(new { message = "Document introuvable" });
            }

            return File(fileBytes, document.ContentType, document.FileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpPost("{id}/version")]
    public async Task<IActionResult> CreateVersion(Guid caseId, Guid id, IFormFile file)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var version = await _documentsService.CreateVersionAsync(caseId, id, userId, file);
            if (version == null)
            {
                return NotFound(new { message = "Document parent introuvable" });
            }

            return Ok(version);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }
}
