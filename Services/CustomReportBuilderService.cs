using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MemoLib.Api.Services;

public class CustomReportBuilderService
{
    private readonly MemoLibDbContext _context;

    public CustomReportBuilderService(MemoLibDbContext context) => _context = context;

    public async Task<CustomReportResult> BuildReportAsync(Guid userId, CustomReportRequest request)
    {
        var result = new CustomReportResult
        {
            ReportName = request.Name,
            GeneratedAt = DateTime.UtcNow,
            DataSource = request.DataSource
        };

        result.Rows = request.DataSource switch
        {
            "CASES" => await BuildCasesReport(userId, request),
            "CLIENTS" => await BuildClientsReport(userId, request),
            "TIME_ENTRIES" => await BuildTimeEntriesReport(userId, request),
            "INVOICES" => await BuildInvoicesReport(userId, request),
            "EVENTS" => await BuildEventsReport(userId, request),
            "TASKS" => await BuildTasksReport(userId, request),
            _ => throw new ArgumentException($"Source de données inconnue: {request.DataSource}")
        };

        result.TotalRows = result.Rows.Count;

        if (request.Aggregations?.Count > 0)
            result.Aggregations = ComputeAggregations(result.Rows, request.Aggregations);

        // Sauvegarder le rapport
        var report = new Report
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            ReportType = $"CUSTOM_{request.DataSource}",
            Filters = request.Filters ?? new(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            GeneratedAt = DateTime.UtcNow,
            ExportUrl = null
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        result.ReportId = report.Id;
        return result;
    }

    private async Task<List<Dictionary<string, object?>>> BuildCasesReport(Guid userId, CustomReportRequest req)
    {
        var query = _context.Cases.Where(c => c.UserId == userId);
        query = ApplyCaseFilters(query, req);

        if (req.StartDate.HasValue) query = query.Where(c => c.CreatedAt >= req.StartDate.Value);
        if (req.EndDate.HasValue) query = query.Where(c => c.CreatedAt <= req.EndDate.Value);

        var cases = await query.OrderByDescending(c => c.CreatedAt).Take(req.Limit).ToListAsync();
        var columns = req.Columns?.Count > 0 ? req.Columns : new List<string>
            { "Title", "Status", "Priority", "Tags", "CreatedAt", "DueDate" };

        return cases.Select(c => ProjectColumns(new Dictionary<string, object?>
        {
            ["Id"] = c.Id,
            ["Title"] = c.Title,
            ["Status"] = c.Status,
            ["Priority"] = c.Priority,
            ["Tags"] = c.Tags,
            ["CreatedAt"] = c.CreatedAt,
            ["DueDate"] = c.DueDate,
            ["ClosedAt"] = c.ClosedAt,
            ["ClientId"] = c.ClientId,
            ["AssignedToUserId"] = c.AssignedToUserId
        }, columns)).ToList();
    }

    private async Task<List<Dictionary<string, object?>>> BuildClientsReport(Guid userId, CustomReportRequest req)
    {
        var clients = await _context.Clients
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .Take(req.Limit)
            .ToListAsync();

        var columns = req.Columns?.Count > 0 ? req.Columns : new List<string>
            { "Name", "Email", "Phone", "CreatedAt" };

        return clients.Select(c => ProjectColumns(new Dictionary<string, object?>
        {
            ["Id"] = c.Id,
            ["Name"] = c.Name,
            ["Email"] = c.Email,
            ["Phone"] = c.PhoneNumber ?? c.Phone,
            ["Address"] = c.Address,
            ["CreatedAt"] = c.CreatedAt
        }, columns)).ToList();
    }

    private async Task<List<Dictionary<string, object?>>> BuildTimeEntriesReport(Guid userId, CustomReportRequest req)
    {
        var query = _context.TimeEntries.Where(t => t.UserId == userId);
        if (req.StartDate.HasValue) query = query.Where(t => t.StartTime >= req.StartDate.Value);
        if (req.EndDate.HasValue) query = query.Where(t => t.StartTime <= req.EndDate.Value);

        var entries = await query.OrderByDescending(t => t.StartTime).Take(req.Limit).ToListAsync();
        var columns = req.Columns?.Count > 0 ? req.Columns : new List<string>
            { "StartTime", "Duration", "Description", "Amount", "CaseId" };

        return entries.Select(e => ProjectColumns(new Dictionary<string, object?>
        {
            ["Id"] = e.Id,
            ["CaseId"] = e.CaseId,
            ["StartTime"] = e.StartTime,
            ["Duration"] = e.Duration,
            ["Description"] = e.Description,
            ["Amount"] = e.Amount,
            ["HourlyRate"] = e.HourlyRate,
            ["IsBillable"] = e.IsBillable
        }, columns)).ToList();
    }

    private async Task<List<Dictionary<string, object?>>> BuildInvoicesReport(Guid userId, CustomReportRequest req)
    {
        var userCaseIds = await _context.Cases
            .Where(c => c.UserId == userId).Select(c => c.Id).ToListAsync();

        var query = _context.Invoices.Where(i => userCaseIds.Contains(i.CaseId));
        if (req.StartDate.HasValue) query = query.Where(i => i.IssueDate >= req.StartDate.Value);
        if (req.EndDate.HasValue) query = query.Where(i => i.IssueDate <= req.EndDate.Value);

        var invoices = await query.OrderByDescending(i => i.IssueDate).Take(req.Limit).ToListAsync();
        var columns = req.Columns?.Count > 0 ? req.Columns : new List<string>
            { "InvoiceNumber", "IssueDate", "TotalAmount", "Status" };

        return invoices.Select(i => ProjectColumns(new Dictionary<string, object?>
        {
            ["Id"] = i.Id,
            ["InvoiceNumber"] = i.InvoiceNumber,
            ["CaseId"] = i.CaseId,
            ["ClientId"] = i.ClientId,
            ["IssueDate"] = i.IssueDate,
            ["DueDate"] = i.DueDate,
            ["TotalAmount"] = i.TotalAmount,
            ["Status"] = i.Status
        }, columns)).ToList();
    }

    private async Task<List<Dictionary<string, object?>>> BuildEventsReport(Guid userId, CustomReportRequest req)
    {
        var sourceIds = await _context.Sources
            .Where(s => s.UserId == userId).Select(s => s.Id).ToListAsync();

        var query = _context.Events.Where(e => sourceIds.Contains(e.SourceId));
        if (req.StartDate.HasValue) query = query.Where(e => e.OccurredAt >= req.StartDate.Value);
        if (req.EndDate.HasValue) query = query.Where(e => e.OccurredAt <= req.EndDate.Value);

        if (req.Filters?.TryGetValue("eventType", out var eventType) == true)
            query = query.Where(e => e.EventType == eventType);

        var events = await query.OrderByDescending(e => e.OccurredAt).Take(req.Limit).ToListAsync();
        var columns = req.Columns?.Count > 0 ? req.Columns : new List<string>
            { "EventType", "OccurredAt", "RequiresAttention" };

        return events.Select(e => ProjectColumns(new Dictionary<string, object?>
        {
            ["Id"] = e.Id,
            ["EventType"] = e.EventType,
            ["OccurredAt"] = e.OccurredAt,
            ["IngestedAt"] = e.IngestedAt,
            ["Severity"] = e.Severity,
            ["RequiresAttention"] = e.RequiresAttention
        }, columns)).ToList();
    }

    private async Task<List<Dictionary<string, object?>>> BuildTasksReport(Guid userId, CustomReportRequest req)
    {
        var caseIds = await _context.Cases
            .Where(c => c.UserId == userId).Select(c => c.Id).ToListAsync();

        var query = _context.CaseTasks.Where(t => caseIds.Contains(t.CaseId));

        if (req.Filters?.TryGetValue("completed", out var completed) == true)
            query = query.Where(t => t.IsCompleted == (completed == "true"));

        var tasks = await query.OrderByDescending(t => t.CreatedAt).Take(req.Limit).ToListAsync();
        var columns = req.Columns?.Count > 0 ? req.Columns : new List<string>
            { "Title", "IsCompleted", "DueDate", "Priority", "CaseId" };

        return tasks.Select(t => ProjectColumns(new Dictionary<string, object?>
        {
            ["Id"] = t.Id,
            ["CaseId"] = t.CaseId,
            ["Title"] = t.Title,
            ["Description"] = t.Description,
            ["Priority"] = t.Priority,
            ["IsCompleted"] = t.IsCompleted,
            ["DueDate"] = t.DueDate,
            ["CompletedAt"] = t.CompletedAt,
            ["CreatedAt"] = t.CreatedAt
        }, columns)).ToList();
    }

    private static IQueryable<Case> ApplyCaseFilters(IQueryable<Case> query, CustomReportRequest req)
    {
        if (req.Filters == null) return query;

        if (req.Filters.TryGetValue("status", out var status))
            query = query.Where(c => c.Status == status);
        if (req.Filters.TryGetValue("priority", out var pri) && int.TryParse(pri, out var p))
            query = query.Where(c => c.Priority >= p);
        if (req.Filters.TryGetValue("tags", out var tags))
            query = query.Where(c => c.Tags != null && c.Tags.Contains(tags));

        return query;
    }

    private static Dictionary<string, object?> ProjectColumns(
        Dictionary<string, object?> allFields, List<string> columns)
    {
        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var col in columns)
        {
            if (allFields.TryGetValue(col, out var val))
                result[col] = val;
        }
        return result;
    }

    private static Dictionary<string, object> ComputeAggregations(
        List<Dictionary<string, object?>> rows, List<AggregationRequest> aggregations)
    {
        var result = new Dictionary<string, object>();

        foreach (var agg in aggregations)
        {
            var values = rows
                .Where(r => r.ContainsKey(agg.Column) && r[agg.Column] != null)
                .Select(r =>
                {
                    var val = r[agg.Column];
                    return val switch
                    {
                        int i => (double)i,
                        decimal d => (double)d,
                        double dbl => dbl,
                        float f => (double)f,
                        _ => double.TryParse(val?.ToString(), out var parsed) ? parsed : (double?)null
                    };
                })
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .ToList();

            var key = $"{agg.Function}_{agg.Column}";
            result[key] = agg.Function.ToUpper() switch
            {
                "SUM" => values.Sum(),
                "AVG" => values.Count > 0 ? Math.Round(values.Average(), 2) : 0,
                "MIN" => values.Count > 0 ? values.Min() : 0,
                "MAX" => values.Count > 0 ? values.Max() : 0,
                "COUNT" => rows.Count,
                _ => 0
            };
        }

        return result;
    }
}

public class CustomReportRequest
{
    public string Name { get; set; } = "Rapport personnalisé";
    public string DataSource { get; set; } = "CASES";
    public List<string>? Columns { get; set; }
    public Dictionary<string, string>? Filters { get; set; }
    public List<AggregationRequest>? Aggregations { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Limit { get; set; } = 500;
}

public class AggregationRequest
{
    public string Column { get; set; } = string.Empty;
    public string Function { get; set; } = "COUNT";
}

public class CustomReportResult
{
    public Guid ReportId { get; set; }
    public string ReportName { get; set; } = string.Empty;
    public string DataSource { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public int TotalRows { get; set; }
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public Dictionary<string, object>? Aggregations { get; set; }
}
