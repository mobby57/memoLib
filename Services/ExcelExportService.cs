using ClosedXML.Excel;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class ExcelExportService
{
    private readonly MemoLibDbContext _context;

    public ExcelExportService(MemoLibDbContext context) => _context = context;

    public async Task<byte[]> ExportCasesAsync(Guid userId, string? status = null, string? tags = null)
    {
        var query = _context.Cases.Where(c => c.UserId == userId);
        if (!string.IsNullOrEmpty(status)) query = query.Where(c => c.Status == status);
        if (!string.IsNullOrEmpty(tags)) query = query.Where(c => c.Tags != null && c.Tags.Contains(tags));

        var cases = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Dossiers");

        // Header
        var headers = new[] { "Titre", "Statut", "Priorité", "Tags", "Créé le", "Échéance", "Fermé le" };
        for (var i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#374151");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        for (var r = 0; r < cases.Count; r++)
        {
            var c = cases[r];
            ws.Cell(r + 2, 1).Value = c.Title;
            ws.Cell(r + 2, 2).Value = c.Status;
            ws.Cell(r + 2, 3).Value = c.Priority;
            ws.Cell(r + 2, 4).Value = c.Tags ?? "";
            ws.Cell(r + 2, 5).Value = c.CreatedAt.ToString("dd/MM/yyyy HH:mm");
            ws.Cell(r + 2, 6).Value = c.DueDate?.ToString("dd/MM/yyyy") ?? "";
            ws.Cell(r + 2, 7).Value = c.ClosedAt?.ToString("dd/MM/yyyy") ?? "";
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportClientsAsync(Guid userId)
    {
        var clients = await _context.Clients
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Clients");

        var headers = new[] { "Nom", "Email", "Téléphone", "Adresse", "Créé le", "Nb Dossiers" };
        for (var i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1a56db");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        var clientIds = clients.Select(c => c.Id).ToList();
        var caseCounts = await _context.Cases
            .Where(c => c.ClientId != null && clientIds.Contains(c.ClientId.Value))
            .GroupBy(c => c.ClientId)
            .Select(g => new { ClientId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ClientId!.Value, x => x.Count);

        for (var r = 0; r < clients.Count; r++)
        {
            var cl = clients[r];
            ws.Cell(r + 2, 1).Value = cl.Name;
            ws.Cell(r + 2, 2).Value = cl.Email;
            ws.Cell(r + 2, 3).Value = cl.PhoneNumber ?? cl.Phone ?? "";
            ws.Cell(r + 2, 4).Value = cl.Address ?? "";
            ws.Cell(r + 2, 5).Value = cl.CreatedAt.ToString("dd/MM/yyyy");
            ws.Cell(r + 2, 6).Value = caseCounts.GetValueOrDefault(cl.Id, 0);
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportTimeEntriesAsync(Guid userId, DateTime? from, DateTime? to)
    {
        var query = _context.TimeEntries.Where(t => t.UserId == userId);
        if (from.HasValue) query = query.Where(t => t.StartTime >= from.Value);
        if (to.HasValue) query = query.Where(t => t.StartTime <= to.Value);

        var entries = await query
            .OrderByDescending(t => t.StartTime)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Temps");

        var headers = new[] { "Date", "Durée (h)", "Description", "Montant", "Dossier" };
        for (var i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#059669");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        for (var r = 0; r < entries.Count; r++)
        {
            var e = entries[r];
            ws.Cell(r + 2, 1).Value = e.StartTime.ToString("dd/MM/yyyy HH:mm");
            ws.Cell(r + 2, 2).Value = Math.Round(e.Duration, 2);
            ws.Cell(r + 2, 3).Value = e.Description ?? "";
            ws.Cell(r + 2, 4).Value = Math.Round(e.Amount, 2);
            ws.Cell(r + 2, 5).Value = e.CaseId.ToString();
        }

        // Total row
        var totalRow = entries.Count + 2;
        ws.Cell(totalRow, 1).Value = "TOTAL";
        ws.Cell(totalRow, 1).Style.Font.Bold = true;
        ws.Cell(totalRow, 2).Value = Math.Round(entries.Sum(e => e.Duration), 2);
        ws.Cell(totalRow, 4).Value = Math.Round(entries.Sum(e => e.Amount), 2);

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportInvoicesAsync(Guid userId, DateTime? from, DateTime? to)
    {
        var userCaseIds = await _context.Cases
            .Where(c => c.UserId == userId)
            .Select(c => c.Id)
            .ToListAsync();

        var query = _context.Invoices.Where(i => userCaseIds.Contains(i.CaseId));
        if (from.HasValue) query = query.Where(i => i.IssueDate >= from.Value);
        if (to.HasValue) query = query.Where(i => i.IssueDate <= to.Value);

        var invoices = await query.OrderByDescending(i => i.IssueDate).ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Factures");

        var headers = new[] { "N° Facture", "Client", "Date", "Montant HT", "TVA", "Total TTC", "Statut" };
        for (var i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#7c3aed");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        for (var r = 0; r < invoices.Count; r++)
        {
            var inv = invoices[r];
            ws.Cell(r + 2, 1).Value = inv.InvoiceNumber ?? inv.Id.ToString()[..8];
            ws.Cell(r + 2, 2).Value = inv.ClientId.ToString();
            ws.Cell(r + 2, 3).Value = inv.IssueDate.ToString("dd/MM/yyyy");
            ws.Cell(r + 2, 4).Value = Math.Round(inv.TotalAmount / 1.2m, 2);
            ws.Cell(r + 2, 5).Value = Math.Round(inv.TotalAmount - inv.TotalAmount / 1.2m, 2);
            ws.Cell(r + 2, 6).Value = Math.Round(inv.TotalAmount, 2);
            ws.Cell(r + 2, 7).Value = inv.Status;
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    private static byte[] WorkbookToBytes(XLWorkbook workbook)
    {
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
