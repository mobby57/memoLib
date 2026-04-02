#!/usr/bin/env pwsh

Write-Host "📄 INSTALLATION EXPORT PDF" -ForegroundColor Cyan

# 1. Service d'export PDF
$pdfService = @'
using System.Text;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Services;

public class PdfExportService
{
    private readonly MemoLibDbContext _context;

    public PdfExportService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportCaseToPdfAsync(Guid caseId, Guid userId)
    {
        var caseEntity = await _context.Cases
            .Include(c => c.Events)
            .FirstOrDefaultAsync(c => c.Id == caseId && c.UserId == userId);

        if (caseEntity == null)
            throw new ArgumentException("Dossier introuvable");

        var html = GenerateCaseHtml(caseEntity);
        return ConvertHtmlToPdf(html);
    }

    private string GenerateCaseHtml(Case caseEntity)
    {
        var html = new StringBuilder();
        html.AppendLine("<!DOCTYPE html>");
        html.AppendLine("<html><head>");
        html.AppendLine("<meta charset='utf-8'>");
        html.AppendLine("<style>");
        html.AppendLine("body { font-family: Arial, sans-serif; margin: 40px; }");
        html.AppendLine(".header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }");
        html.AppendLine(".title { color: #667eea; font-size: 24px; font-weight: bold; }");
        html.AppendLine(".info { margin: 10px 0; }");
        html.AppendLine(".event { border-left: 3px solid #667eea; padding-left: 15px; margin: 20px 0; }");
        html.AppendLine(".date { color: #666; font-size: 12px; }");
        html.AppendLine("</style>");
        html.AppendLine("</head><body>");

        // En-tête
        html.AppendLine("<div class='header'>");
        html.AppendLine($"<div class='title'>{caseEntity.Title}</div>");
        html.AppendLine($"<div class='info'>ID: {caseEntity.Id}</div>");
        html.AppendLine($"<div class='info'>Créé le: {caseEntity.CreatedAt:dd/MM/yyyy HH:mm}</div>");
        html.AppendLine($"<div class='info'>Statut: {caseEntity.Status}</div>");
        html.AppendLine("</div>");

        // Événements
        html.AppendLine("<h3>Timeline des événements</h3>");
        foreach (var evt in caseEntity.Events.OrderBy(e => e.OccurredAt))
        {
            html.AppendLine("<div class='event'>");
            html.AppendLine($"<div class='date'>{evt.OccurredAt:dd/MM/yyyy HH:mm}</div>");
            
            if (!string.IsNullOrEmpty(evt.RawPayload))
            {
                try
                {
                    var payload = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(evt.RawPayload);
                    if (payload.ContainsKey("subject"))
                        html.AppendLine($"<div><strong>Sujet:</strong> {payload["subject"]}</div>");
                    if (payload.ContainsKey("from"))
                        html.AppendLine($"<div><strong>De:</strong> {payload["from"]}</div>");
                    if (payload.ContainsKey("body"))
                        html.AppendLine($"<div><strong>Message:</strong> {payload["body"]}</div>");
                }
                catch
                {
                    html.AppendLine($"<div>{evt.RawPayload}</div>");
                }
            }
            
            html.AppendLine("</div>");
        }

        html.AppendLine("</body></html>");
        return html.ToString();
    }

    private byte[] ConvertHtmlToPdf(string html)
    {
        // Version simple - retourne le HTML en bytes
        // En production, utiliser une librairie comme PuppeteerSharp ou wkhtmltopdf
        return Encoding.UTF8.GetBytes(html);
    }
}
'@

$servicePath = "../Services/PdfExportService.cs"
Set-Content -Path $servicePath -Value $pdfService -Encoding UTF8

# 2. Contrôleur d'export
$exportController = @'
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly PdfExportService _pdfService;

    public ExportController(PdfExportService pdfService)
    {
        _pdfService = pdfService;
    }

    [HttpGet("case/{caseId}/pdf")]
    public async Task<IActionResult> ExportCaseToPdf(Guid caseId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        try
        {
            var pdfBytes = await _pdfService.ExportCaseToPdfAsync(caseId, userId);
            return File(pdfBytes, "text/html", $"dossier-{caseId}.html");
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
'@

$controllerPath = "../Controllers/ExportController.cs"
Set-Content -Path $controllerPath -Value $exportController -Encoding UTF8

# 3. Interface d'export
$exportHtml = @'
<!DOCTYPE html>
<html>
<head>
    <title>Export PDF - MemoLib</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .case-list { margin-top: 20px; }
        .case-item { padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; cursor: pointer; }
        .case-item:hover { background: #f0f0f0; }
        .export-btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .export-btn:hover { background: #5568d3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Export PDF des Dossiers</h1>
            <p>Sélectionnez un dossier à exporter</p>
        </div>

        <div class="case-list" id="caseList">
            <p>Chargement des dossiers...</p>
        </div>
    </div>

    <script>
        const API_URL = 'http://localhost:5078';
        let token = localStorage.getItem('memolib_token');

        async function loadCases() {
            try {
                const response = await fetch(`${API_URL}/api/cases`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    document.getElementById('caseList').innerHTML = '<p>Erreur de chargement</p>';
                    return;
                }
                
                const cases = await response.json();
                displayCases(cases);
            } catch (error) {
                document.getElementById('caseList').innerHTML = '<p>Erreur de connexion</p>';
            }
        }

        function displayCases(cases) {
            const list = document.getElementById('caseList');
            
            if (cases.length === 0) {
                list.innerHTML = '<p>Aucun dossier trouvé</p>';
                return;
            }

            list.innerHTML = cases.map(c => `
                <div class="case-item" onclick="exportCase('${c.id}')">
                    <h3>${c.title}</h3>
                    <p>Créé le: ${new Date(c.createdAt).toLocaleDateString()}</p>
                    <button class="export-btn" onclick="event.stopPropagation(); exportCase('${c.id}')">
                        📄 Exporter en PDF
                    </button>
                </div>
            `).join('');
        }

        async function exportCase(caseId) {
            try {
                const response = await fetch(`${API_URL}/api/export/case/${caseId}/pdf`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    alert('Erreur lors de l\'export');
                    return;
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dossier-${caseId}.html`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                alert('Export réussi!');
            } catch (error) {
                alert('Erreur lors de l\'export');
            }
        }

        // Chargement initial
        loadCases();
    </script>
</body>
</html>
'@

$htmlPath = "../wwwroot/export.html"
Set-Content -Path $htmlPath -Value $exportHtml -Encoding UTF8

Write-Host "✅ Export PDF installé!" -ForegroundColor Green
Write-Host "📄 Interface: http://localhost:5078/export.html" -ForegroundColor Cyan