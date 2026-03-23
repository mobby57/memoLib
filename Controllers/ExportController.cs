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
    private readonly ExcelExportService _excelService;

    public ExportController(MemoLibDbContext context, PdfExportService pdfService, ExportService exportService, ExcelExportService excelService)
    {
        _context = context;
        _pdfService = pdfService;
        _exportService = exportService;
        _excelService = excelService;
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

    /// <summary>
    /// Exporte les dossiers en Excel (.xlsx)
    /// </summary>
    [HttpGet("cases/excel")]
    public async Task<IActionResult> ExportCasesExcel([FromQuery] string? status = null, [FromQuery] string? tags = null)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var excel = await _excelService.ExportCasesAsync(userId, status, tags);
        return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "dossiers.xlsx");
    }

    /// <summary>
    /// Exporte les clients en Excel (.xlsx)
    /// </summary>
    [HttpGet("clients/excel")]
    public async Task<IActionResult> ExportClientsExcel()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var excel = await _excelService.ExportClientsAsync(userId);
        return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "clients.xlsx");
    }

    /// <summary>
    /// Exporte les entrées de temps en Excel (.xlsx)
    /// </summary>
    [HttpGet("time-entries/excel")]
    public async Task<IActionResult> ExportTimeEntriesExcel([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var excel = await _excelService.ExportTimeEntriesAsync(userId, from, to);
        return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "temps.xlsx");
    }

    /// <summary>
    /// Exporte une facture en PDF
    /// </summary>
    [HttpGet("invoice/{invoiceId}/pdf")]
    public async Task<IActionResult> ExportInvoicePdf(Guid invoiceId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        try
        {
            var pdf = await _pdfService.ExportInvoicePdfAsync(invoiceId, userId);
            return File(pdf, "application/pdf", $"facture-{invoiceId:N}.pdf");
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Exporte un relevé d'heures en PDF
    /// </summary>
    [HttpGet("time-entries/pdf")]
    public async Task<IActionResult> ExportTimeEntriesPdf([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var pdf = await _pdfService.ExportTimeEntriesReportPdfAsync(userId, from, to);
        return File(pdf, "application/pdf", "releve-heures.pdf");
    }

    /// <summary>
    /// Exporte les factures en Excel (.xlsx)
    /// </summary>
    [HttpGet("invoices/excel")]
    public async Task<IActionResult> ExportInvoicesExcel([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var excel = await _excelService.ExportInvoicesAsync(userId, from, to);
        return File(excel, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "factures.xlsx");
    }
}
