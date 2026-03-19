using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MemoLib.Api.Services;

public class PdfExportService
{
    private readonly MemoLibDbContext _context;

    public PdfExportService(MemoLibDbContext context)
    {
        _context = context;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> ExportCasePdfAsync(Guid caseId, Guid userId)
    {
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId && c.UserId == userId)
            ?? throw new Exception("Dossier non trouvé");

        var client = caseEntity.ClientId.HasValue
            ? await _context.Clients.FirstOrDefaultAsync(c => c.Id == caseEntity.ClientId)
            : null;

        var events = await _context.CaseEvents
            .Where(ce => ce.CaseId == caseId)
            .Join(_context.Events, ce => ce.EventId, e => e.Id, (ce, e) => e)
            .OrderBy(e => e.OccurredAt)
            .ToListAsync();

        var activities = await _context.CaseActivities
            .Where(a => a.CaseId == caseId)
            .OrderBy(a => a.OccurredAt)
            .ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(30);

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text("MemoLib").FontSize(20).Bold().FontColor("#1a56db");
                        row.ConstantItem(150).AlignRight().Text(DateTime.Now.ToString("dd/MM/yyyy")).FontSize(10).FontColor("#6b7280");
                    });
                    col.Item().PaddingBottom(10).LineHorizontal(1).LineColor("#e5e7eb");
                });

                page.Content().Column(col =>
                {
                    // Titre dossier
                    col.Item().PaddingBottom(15).Text($"Dossier : {caseEntity.Title}").FontSize(16).Bold();

                    // Infos dossier
                    col.Item().PaddingBottom(10).Background("#f9fafb").Padding(10).Column(info =>
                    {
                        info.Item().Text($"Statut : {caseEntity.Status}").FontSize(10);
                        info.Item().Text($"Priorité : {caseEntity.Priority}").FontSize(10);
                        info.Item().Text($"Créé le : {caseEntity.CreatedAt:dd/MM/yyyy HH:mm}").FontSize(10);
                        if (caseEntity.DueDate.HasValue)
                            info.Item().Text($"Échéance : {caseEntity.DueDate:dd/MM/yyyy}").FontSize(10);
                        if (!string.IsNullOrEmpty(caseEntity.Tags))
                            info.Item().Text($"Tags : {caseEntity.Tags}").FontSize(10);
                    });

                    // Client
                    if (client != null)
                    {
                        col.Item().PaddingTop(10).PaddingBottom(5).Text("Client").FontSize(12).Bold();
                        col.Item().PaddingBottom(10).Background("#f0f9ff").Padding(10).Column(c =>
                        {
                            c.Item().Text($"Nom : {client.Name}").FontSize(10);
                            c.Item().Text($"Email : {client.Email}").FontSize(10);
                            if (!string.IsNullOrEmpty(client.PhoneNumber))
                                c.Item().Text($"Tél : {client.PhoneNumber}").FontSize(10);
                            if (!string.IsNullOrEmpty(client.Address))
                                c.Item().Text($"Adresse : {client.Address}").FontSize(10);
                        });
                    }

                    // Événements
                    if (events.Count > 0)
                    {
                        col.Item().PaddingTop(10).PaddingBottom(5).Text($"Événements ({events.Count})").FontSize(12).Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(120);
                                columns.ConstantColumn(70);
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#374151").Padding(5).Text("Date").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#374151").Padding(5).Text("Type").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#374151").Padding(5).Text("Contenu").FontSize(9).FontColor("#ffffff");
                            });

                            foreach (var evt in events)
                            {
                                var bg = events.IndexOf(evt) % 2 == 0 ? "#ffffff" : "#f9fafb";
                                table.Cell().Background(bg).Padding(4).Text(evt.OccurredAt.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                                table.Cell().Background(bg).Padding(4).Text(evt.EventType ?? "-").FontSize(8);
                                table.Cell().Background(bg).Padding(4).Text(Truncate(evt.TextForEmbedding ?? evt.RawPayload, 120)).FontSize(8);
                            }
                        });
                    }

                    // Activités
                    if (activities.Count > 0)
                    {
                        col.Item().PaddingTop(15).PaddingBottom(5).Text($"Activités ({activities.Count})").FontSize(12).Bold();
                        foreach (var a in activities.TakeLast(20))
                        {
                            col.Item().PaddingBottom(3).Text($"[{a.OccurredAt:dd/MM/yyyy HH:mm}] {a.UserName} — {a.Description}").FontSize(9);
                        }
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("MemoLib — Confidentiel — Page ").FontSize(8).FontColor("#9ca3af");
                    text.CurrentPageNumber().FontSize(8).FontColor("#9ca3af");
                    text.Span(" / ").FontSize(8).FontColor("#9ca3af");
                    text.TotalPages().FontSize(8).FontColor("#9ca3af");
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> ExportClientReportPdfAsync(Guid clientId, Guid userId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == clientId && c.UserId == userId)
            ?? throw new Exception("Client non trouvé");

        var cases = await _context.Cases
            .Where(c => c.UserId == userId && c.ClientId == clientId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(30);

                page.Header().Column(col =>
                {
                    col.Item().Text("MemoLib — Fiche Client").FontSize(18).Bold().FontColor("#1a56db");
                    col.Item().PaddingBottom(10).LineHorizontal(1).LineColor("#e5e7eb");
                });

                page.Content().Column(col =>
                {
                    col.Item().PaddingBottom(10).Background("#f0f9ff").Padding(12).Column(info =>
                    {
                        info.Item().Text(client.Name).FontSize(14).Bold();
                        info.Item().Text($"Email : {client.Email}").FontSize(10);
                        if (!string.IsNullOrEmpty(client.PhoneNumber))
                            info.Item().Text($"Tél : {client.PhoneNumber}").FontSize(10);
                        if (!string.IsNullOrEmpty(client.Address))
                            info.Item().Text($"Adresse : {client.Address}").FontSize(10);
                        info.Item().Text($"Client depuis : {client.CreatedAt:dd/MM/yyyy}").FontSize(10);
                    });

                    col.Item().PaddingTop(15).PaddingBottom(5).Text($"Dossiers ({cases.Count})").FontSize(12).Bold();

                    if (cases.Count > 0)
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.ConstantColumn(80);
                                columns.ConstantColumn(50);
                                columns.ConstantColumn(90);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#374151").Padding(5).Text("Titre").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#374151").Padding(5).Text("Statut").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#374151").Padding(5).Text("Priorité").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#374151").Padding(5).Text("Créé le").FontSize(9).FontColor("#ffffff");
                            });

                            foreach (var c in cases)
                            {
                                var bg = cases.IndexOf(c) % 2 == 0 ? "#ffffff" : "#f9fafb";
                                table.Cell().Background(bg).Padding(4).Text(c.Title).FontSize(9);
                                table.Cell().Background(bg).Padding(4).Text(c.Status).FontSize(9);
                                table.Cell().Background(bg).Padding(4).Text(c.Priority.ToString()).FontSize(9);
                                table.Cell().Background(bg).Padding(4).Text(c.CreatedAt.ToString("dd/MM/yyyy")).FontSize(9);
                            }
                        });
                    }
                    else
                    {
                        col.Item().Text("Aucun dossier associé.").FontSize(10).Italic();
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span($"Généré le {DateTime.Now:dd/MM/yyyy HH:mm} — Confidentiel — Page ").FontSize(8).FontColor("#9ca3af");
                    text.CurrentPageNumber().FontSize(8).FontColor("#9ca3af");
                });
            });
        });

        return document.GeneratePdf();
    }

    private static string Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrEmpty(text)) return "-";
        return text.Length <= maxLength ? text : text[..maxLength] + "…";
    }
}
