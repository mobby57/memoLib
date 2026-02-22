using MemoLib.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class AnalyticsService
{
    private readonly MemoLibDbContext _context;

    public AnalyticsService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardMetrics> GetMetricsAsync(Guid userId)
    {
        var today = DateTime.Today;
        var thisWeek = today.AddDays(-7);
        var thisMonth = today.AddDays(-30);

        var emailsToday = await _context.Events
            .Where(e => e.OccurredAt >= today && _context.Cases
                .Any(c => c.UserId == userId && _context.CaseEvents
                    .Any(ce => ce.CaseId == c.Id && ce.EventId == e.Id)))
            .CountAsync();

        var totalCases = await _context.Cases
            .Where(c => c.UserId == userId)
            .CountAsync();

        var openAnomalies = await _context.Events
            .Where(e => e.RequiresAttention && _context.Cases
                .Any(c => c.UserId == userId && _context.CaseEvents
                    .Any(ce => ce.CaseId == c.Id && ce.EventId == e.Id)))
            .CountAsync();

        var avgResponseTime = await CalculateAverageResponseTimeAsync(userId);

        return new DashboardMetrics
        {
            EmailsToday = emailsToday,
            TotalCases = totalCases,
            OpenAnomalies = openAnomalies,
            AverageResponseTimeHours = avgResponseTime,
            WeeklyTrend = await GetWeeklyTrendAsync(userId),
            TopClients = await GetTopClientsAsync(userId)
        };
    }

    private async Task<double> CalculateAverageResponseTimeAsync(Guid userId)
    {
        var responses = await _context.QuestionnaireResponses
            .Where(qr => qr.UserId == userId && qr.CompletedAt >= DateTime.UtcNow.AddDays(-30))
            .Select(qr => new { qr.CompletedAt, EventDate = _context.Events
                .Where(e => e.Id == qr.EventId)
                .Select(e => e.OccurredAt)
                .FirstOrDefault() })
            .ToListAsync();

        if (!responses.Any()) return 0;

        var avgHours = responses
            .Where(r => r.EventDate != default)
            .Average(r => (r.CompletedAt - r.EventDate).TotalHours);

        return Math.Round(avgHours, 1);
    }

    private async Task<List<WeeklyTrendItem>> GetWeeklyTrendAsync(Guid userId)
    {
        var weekAgo = DateTime.Today.AddDays(-7);
        
        return await _context.Events
            .Where(e => e.OccurredAt >= weekAgo && _context.Cases
                .Any(c => c.UserId == userId && _context.CaseEvents
                    .Any(ce => ce.CaseId == c.Id && ce.EventId == e.Id)))
            .GroupBy(e => e.OccurredAt.Date)
            .Select(g => new WeeklyTrendItem
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(w => w.Date)
            .ToListAsync();
    }

    private async Task<List<TopClientItem>> GetTopClientsAsync(Guid userId)
    {
        return await _context.Cases
            .Where(c => c.UserId == userId && c.ClientId != null)
            .GroupBy(c => c.ClientId)
            .Select(g => new TopClientItem
            {
                ClientId = g.Key!.Value,
                CaseCount = g.Count(),
                ClientName = _context.Clients
                    .Where(cl => cl.Id == g.Key)
                    .Select(cl => cl.Name)
                    .FirstOrDefault() ?? "Client inconnu"
            })
            .OrderByDescending(t => t.CaseCount)
            .Take(5)
            .ToListAsync();
    }
}

public class DashboardMetrics
{
    public int EmailsToday { get; set; }
    public int TotalCases { get; set; }
    public int OpenAnomalies { get; set; }
    public double AverageResponseTimeHours { get; set; }
    public List<WeeklyTrendItem> WeeklyTrend { get; set; } = new();
    public List<TopClientItem> TopClients { get; set; } = new();
}

public class WeeklyTrendItem
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class TopClientItem
{
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = null!;
    public int CaseCount { get; set; }
}