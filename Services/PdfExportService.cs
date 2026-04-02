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

    public async Task<byte[]> ExportInvoicePdfAsync(Guid invoiceId, Guid userId)
    {
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.Id == invoiceId)
            ?? throw new Exception("Facture non trouvée");

        var caseEntity = await _context.Cases.FirstOrDefaultAsync(c => c.Id == invoice.CaseId && c.UserId == userId)
            ?? throw new Exception("Accès refusé");

        var client = invoice.ClientId != Guid.Empty
            ? await _context.Clients.FirstOrDefaultAsync(c => c.Id == invoice.ClientId)
            : null;

        var timeEntries = await _context.TimeEntries
            .Where(t => t.CaseId == invoice.CaseId && t.UserId == userId)
            .OrderBy(t => t.StartTime)
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
                        row.RelativeItem().Text("FACTURE").FontSize(22).Bold().FontColor("#7c3aed");
                        row.ConstantItem(200).AlignRight().Column(right =>
                        {
                            right.Item().Text($"N° {invoice.InvoiceNumber ?? invoice.Id.ToString()[..8]}").FontSize(11).Bold();
                            right.Item().Text($"Date : {invoice.IssueDate:dd/MM/yyyy}").FontSize(10);
                            if (invoice.DueDate != default)
                                right.Item().Text($"Échéance : {invoice.DueDate:dd/MM/yyyy}").FontSize(10);
                        });
                    });
                    col.Item().PaddingVertical(8).LineHorizontal(2).LineColor("#7c3aed");
                });

                page.Content().Column(col =>
                {
                    // Client info
                    if (client != null)
                    {
                        col.Item().PaddingBottom(15).Background("#faf5ff").Padding(10).Column(c =>
                        {
                            c.Item().Text("Facturé à :").FontSize(9).FontColor("#6b7280");
                            c.Item().Text(client.Name).FontSize(11).Bold();
                            c.Item().Text(client.Email).FontSize(10);
                            if (!string.IsNullOrEmpty(client.Address))
                                c.Item().Text(client.Address).FontSize(10);
                        });
                    }

                    col.Item().PaddingBottom(5).Text($"Dossier : {caseEntity.Title}").FontSize(10).FontColor("#6b7280");

                    // Détail prestations
                    if (timeEntries.Count > 0)
                    {
                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(90);
                                columns.RelativeColumn();
                                columns.ConstantColumn(60);
                                columns.ConstantColumn(80);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#7c3aed").Padding(5).Text("Date").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#7c3aed").Padding(5).Text("Description").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#7c3aed").Padding(5).Text("Heures").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#7c3aed").Padding(5).Text("Montant").FontSize(9).FontColor("#ffffff");
                            });

                            foreach (var te in timeEntries)
                            {
                                var bg = timeEntries.IndexOf(te) % 2 == 0 ? "#ffffff" : "#faf5ff";
                                table.Cell().Background(bg).Padding(4).Text(te.StartTime.ToString("dd/MM/yyyy")).FontSize(8);
                                table.Cell().Background(bg).Padding(4).Text(te.Description ?? "-").FontSize(8);
                                table.Cell().Background(bg).Padding(4).AlignRight().Text($"{te.Duration:F2}h").FontSize(8);
                                table.Cell().Background(bg).Padding(4).AlignRight().Text($"{te.Amount:F2} €").FontSize(8);
                            }
                        });
                    }

                    // Totaux
                    var ht = invoice.TotalAmount / 1.2m;
                    var tva = invoice.TotalAmount - ht;
                    col.Item().PaddingTop(15).AlignRight().Column(totals =>
                    {
                        totals.Item().Text($"Total HT : {ht:F2} €").FontSize(10);
                        totals.Item().Text($"TVA (20%) : {tva:F2} €").FontSize(10);
                        totals.Item().PaddingTop(5).Text($"Total TTC : {invoice.TotalAmount:F2} €").FontSize(13).Bold().FontColor("#7c3aed");
                    });

                    col.Item().PaddingTop(20).Text($"Statut : {invoice.Status}").FontSize(10).Bold();
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("MemoLib — Confidentiel").FontSize(8).FontColor("#9ca3af");
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> ExportTimeEntriesReportPdfAsync(Guid userId, DateTime? from, DateTime? to)
    {
        var query = _context.TimeEntries.Where(t => t.UserId == userId);
        if (from.HasValue) query = query.Where(t => t.StartTime >= from.Value);
        if (to.HasValue) query = query.Where(t => t.StartTime <= to.Value);

        var entries = await query.OrderByDescending(t => t.StartTime).ToListAsync();
        var totalHours = entries.Sum(e => e.Duration);
        var totalAmount = entries.Sum(e => e.Amount);

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
                        row.RelativeItem().Text("Relevé d'heures").FontSize(18).Bold().FontColor("#059669");
                        row.ConstantItem(150).AlignRight().Text(DateTime.Now.ToString("dd/MM/yyyy")).FontSize(10).FontColor("#6b7280");
                    });
                    col.Item().PaddingBottom(8).LineHorizontal(1).LineColor("#e5e7eb");
                    if (from.HasValue || to.HasValue)
                        col.Item().PaddingBottom(10).Text($"Période : {from?.ToString("dd/MM/yyyy") ?? "début"} — {to?.ToString("dd/MM/yyyy") ?? "aujourd'hui"}").FontSize(10).FontColor("#6b7280");
                });

                page.Content().Column(col =>
                {
                    // Summary
                    col.Item().PaddingBottom(15).Row(row =>
                    {
                        row.RelativeItem().Background("#ecfdf5").Padding(10).Column(c =>
                        {
                            c.Item().Text($"{entries.Count}").FontSize(20).Bold().FontColor("#059669");
                            c.Item().Text("Entrées").FontSize(9);
                        });
                        row.ConstantItem(10);
                        row.RelativeItem().Background("#ecfdf5").Padding(10).Column(c =>
                        {
                            c.Item().Text($"{totalHours:F1}h").FontSize(20).Bold().FontColor("#059669");
                            c.Item().Text("Total heures").FontSize(9);
                        });
                        row.ConstantItem(10);
                        row.RelativeItem().Background("#ecfdf5").Padding(10).Column(c =>
                        {
                            c.Item().Text($"{totalAmount:F2} €").FontSize(20).Bold().FontColor("#059669");
                            c.Item().Text("Montant total").FontSize(9);
                        });
                    });

                    if (entries.Count > 0)
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(90);
                                columns.RelativeColumn();
                                columns.ConstantColumn(55);
                                columns.ConstantColumn(70);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#059669").Padding(5).Text("Date").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#059669").Padding(5).Text("Description").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#059669").Padding(5).Text("Heures").FontSize(9).FontColor("#ffffff");
                                header.Cell().Background("#059669").Padding(5).Text("Montant").FontSize(9).FontColor("#ffffff");
                            });

                            foreach (var e in entries)
                            {
                                var bg = entries.IndexOf(e) % 2 == 0 ? "#ffffff" : "#ecfdf5";
                                table.Cell().Background(bg).Padding(4).Text(e.StartTime.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                                table.Cell().Background(bg).Padding(4).Text(e.Description ?? "-").FontSize(8);
                                table.Cell().Background(bg).Padding(4).AlignRight().Text($"{e.Duration:F2}").FontSize(8);
                                table.Cell().Background(bg).Padding(4).AlignRight().Text($"{e.Amount:F2} €").FontSize(8);
                            }
                        });
                    }
                    else
                    {
                        col.Item().Text("Aucune entrée de temps pour cette période.").FontSize(10).Italic();
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

    private static string Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrEmpty(text)) return "-";
        return text.Length <= maxLength ? text : text[..maxLength] + "…";
    }
}
