using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/export")]
public class ExportController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly PdfExportService _pdfService;
    private readonly ExportService _exportService;

    public ExportController(MemoLibDbContext context, PdfExportService pdfService, ExportService exportService)
    {
        _context = context;
        _pdfService = pdfService;
        _exportService = exportService;
    }

    [HttpGet("events-text")]
    public async Task<IActionResult> ExportText()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var data = await _context.Events
            .AsNoTracking()
            .Where(e => userSourceIds.Contains(e.SourceId))
            .Select(e => new { e.Id, e.TextForEmbedding })
            .ToListAsync();

        return Ok(data);
    }

    /// <summary>
    /// Exporte un dossier en PDF
    /// </summary>
    [HttpGet("case/{caseId}/pdf")]
    public async Task<IActionResult> ExportCasePdf(Guid caseId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        try
        {
            var pdf = await _pdfService.ExportCasePdfAsync(caseId, userId);
            return File(pdf, "application/pdf", $"dossier-{caseId:N}.pdf");
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Exporte un dossier en JSON/CSV/TXT
    /// </summary>
    [HttpGet("case/{caseId}")]
    public async Task<IActionResult> ExportCase(Guid caseId, [FromQuery] string format = "json")
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        try
        {
            var (data, contentType, fileName) = await _exportService.ExportCaseAsync(caseId, userId, format);
            return File(data, contentType, fileName);
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Exporte une fiche client en PDF
    /// </summary>
    [HttpGet("client/{clientId}/pdf")]
    public async Task<IActionResult> ExportClientPdf(Guid clientId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        try
        {
            var pdf = await _pdfService.ExportClientReportPdfAsync(clientId, userId);
            return File(pdf, "application/pdf", $"client-{clientId:N}.pdf");
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
