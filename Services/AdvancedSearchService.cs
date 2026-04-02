using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class AdvancedSearchService
{
    private readonly MemoLibDbContext _context;

    public AdvancedSearchService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<object> SearchAsync(Guid userId, SearchCriteria criteria)
    {
        var query = _context.Cases.Where(c => c.UserId == userId);

        // Filtres
        if (!string.IsNullOrEmpty(criteria.Status))
            query = query.Where(c => c.Status == criteria.Status);

        if (criteria.Priority.HasValue)
            query = query.Where(c => c.Priority == criteria.Priority);

        if (criteria.AssignedToUserId.HasValue)
            query = query.Where(c => c.AssignedToUserId == criteria.AssignedToUserId);

        if (!string.IsNullOrEmpty(criteria.Tags))
        {
            var tags = criteria.Tags.Split(',');
            query = query.Where(c => tags.Any(tag => c.Tags != null && c.Tags.Contains(tag)));
        }

        if (criteria.CreatedAfter.HasValue)
            query = query.Where(c => c.CreatedAt >= criteria.CreatedAfter);

        if (criteria.CreatedBefore.HasValue)
            query = query.Where(c => c.CreatedAt <= criteria.CreatedBefore);

        if (!string.IsNullOrEmpty(criteria.SearchText))
            query = query.Where(c => c.Title != null && c.Title.Contains(criteria.SearchText));

        // Tri
        query = criteria.SortBy switch
        {
            "priority" => criteria.SortDesc ? query.OrderByDescending(c => c.Priority) : query.OrderBy(c => c.Priority),
            "status" => criteria.SortDesc ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
            "title" => criteria.SortDesc ? query.OrderByDescending(c => c.Title) : query.OrderBy(c => c.Title),
            _ => criteria.SortDesc ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt)
        };

        var total = await query.CountAsync();
        var cases = await query
            .Skip(criteria.Skip)
            .Take(criteria.Take)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Status,
                c.Priority,
                c.Tags,
                c.AssignedToUserId,
                c.CreatedAt,
                MessageCount = _context.CaseEvents.Count(ce => ce.CaseId == c.Id),
                LastActivity = _context.CaseActivities
                    .Where(a => a.CaseId == c.Id)
                    .OrderByDescending(a => a.OccurredAt)
                    .Select(a => a.OccurredAt)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return new { total, cases, page = criteria.Skip / criteria.Take + 1, pageSize = criteria.Take };
    }
}

public class SearchCriteria
{
    public string? Status { get; set; }
    public int? Priority { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? Tags { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
    public string? SearchText { get; set; }
    public string SortBy { get; set; } = "createdAt";
    public bool SortDesc { get; set; } = true;
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}
