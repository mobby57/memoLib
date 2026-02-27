using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace MemoLib.Api.Services;

public class ExportService
{
    private readonly MemoLibDbContext _context;

    public ExportService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<(byte[] Data, string ContentType, string FileName)> ExportCaseAsync(
        Guid caseId, Guid userId, string format)
    {
        var case_ = await _context.Cases.FirstOrDefaultAsync(c => c.Id == caseId && c.UserId == userId);
        if (case_ == null) throw new Exception("Dossier non trouvé");

        var events = await _context.CaseEvents
            .Where(ce => ce.CaseId == caseId)
            .Join(_context.Events, ce => ce.EventId, e => e.Id, (ce, e) => e)
            .OrderBy(e => e.OccurredAt)
            .ToListAsync();

        var activities = await _context.CaseActivities
            .Where(a => a.CaseId == caseId)
            .OrderBy(a => a.OccurredAt)
            .ToListAsync();

        return format.ToLower() switch
        {
            "json" => ExportJson(case_, events, activities),
            "csv" => ExportCsv(case_, events, activities),
            "txt" => ExportText(case_, events, activities),
            _ => throw new Exception("Format non supporté")
        };
    }

    private (byte[], string, string) ExportJson(Case case_, List<Event> events, List<CaseActivity> activities)
    {
        var data = new
        {
            case_.Id,
            case_.Title,
            case_.Status,
            case_.Priority,
            case_.Tags,
            case_.CreatedAt,
            Events = events.Select(e => new { e.Id, e.Type, e.OccurredAt }),
            Activities = activities.Select(a => new { a.ActivityType, a.Description, a.UserName, a.OccurredAt })
        };

        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
        return (Encoding.UTF8.GetBytes(json), "application/json", $"case-{case_.Id}.json");
    }

    private (byte[], string, string) ExportCsv(Case case_, List<Event> events, List<CaseActivity> activities)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Type,Date,Description");
        
        foreach (var evt in events)
            sb.AppendLine($"Event,{evt.OccurredAt:yyyy-MM-dd HH:mm},{evt.Type}");

        foreach (var activity in activities)
            sb.AppendLine($"Activity,{activity.OccurredAt:yyyy-MM-dd HH:mm},{activity.Description}");

        return (Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", $"case-{case_.Id}.csv");
    }

    private (byte[], string, string) ExportText(Case case_, List<Event> events, List<CaseActivity> activities)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"DOSSIER: {case_.Title}");
        sb.AppendLine($"Statut: {case_.Status}");
        sb.AppendLine($"Priorité: {case_.Priority}");
        sb.AppendLine();

        sb.AppendLine("ÉVÉNEMENTS:");
        foreach (var evt in events)
            sb.AppendLine($"[{evt.OccurredAt:yyyy-MM-dd HH:mm}] {evt.Type}");
        
        sb.AppendLine();
        sb.AppendLine("ACTIVITÉS:");
        foreach (var activity in activities)
            sb.AppendLine($"[{activity.OccurredAt:yyyy-MM-dd HH:mm}] {activity.UserName}: {activity.Description}");

        return (Encoding.UTF8.GetBytes(sb.ToString()), "text/plain", $"case-{case_.Id}.txt");
    }
}
