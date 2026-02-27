using MemoLib.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class FullTextSearchService
{
    private readonly MemoLibDbContext _context;

    public FullTextSearchService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<SearchResults> SearchEverythingAsync(Guid userId, string query, int limit = 50)
    {
        var results = new SearchResults();
        query = query.ToLower();

        // Recherche dans dossiers
        results.Cases = await _context.Cases
            .Where(c => c.UserId == userId && 
                (c.Title != null && c.Title.ToLower().Contains(query) ||
                 c.Tags != null && c.Tags.ToLower().Contains(query)))
            .Take(limit)
            .Select(c => new { c.Id, c.Title, c.Status, c.Priority, Type = "Case" })
            .ToListAsync();

        // Recherche dans événements (emails, SMS, etc.)
        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        results.Events = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId) &&
                e.RawPayload != null && e.RawPayload.ToLower().Contains(query))
            .Take(limit)
            .Select(e => new { e.Id, EventType = e.Type, e.OccurredAt, Preview = e.RawPayload!.Substring(0, Math.Min(100, e.RawPayload.Length)), Type = "Event" })
            .ToListAsync();

        // Recherche dans commentaires
        var userCaseIds = await _context.Cases
            .Where(c => c.UserId == userId)
            .Select(c => c.Id)
            .ToListAsync();

        results.Comments = await _context.CaseComments
            .Where(c => userCaseIds.Contains(c.CaseId) && 
                !c.IsDeleted &&
                c.Content.ToLower().Contains(query))
            .Take(limit)
            .Join(_context.Users, c => c.UserId, u => u.Id, (c, u) => new
            {
                c.Id,
                c.CaseId,
                c.Content,
                UserName = u.Name ?? u.Email,
                c.CreatedAt,
                Type = "Comment"
            })
            .ToListAsync();

        // Recherche dans clients
        results.Clients = await _context.Clients
            .Where(c => c.UserId == userId &&
                (c.Name != null && c.Name.ToLower().Contains(query) ||
                 c.Email != null && c.Email.ToLower().Contains(query) ||
                 c.Phone != null && c.Phone.Contains(query)))
            .Take(limit)
            .Select(c => new { c.Id, c.Name, c.Email, c.Phone, Type = "Client" })
            .ToListAsync();

        // Recherche dans documents
        results.Documents = await _context.CaseDocuments
            .Where(d => userCaseIds.Contains(d.CaseId) &&
                d.FileName.ToLower().Contains(query))
            .Take(limit)
            .Select(d => new { d.Id, d.CaseId, d.FileName, d.UploadedAt, Type = "Document" })
            .ToListAsync();

        return results;
    }
}

public class SearchResults
{
    public object Cases { get; set; } = new List<object>();
    public object Events { get; set; } = new List<object>();
    public object Comments { get; set; } = new List<object>();
    public object Clients { get; set; } = new List<object>();
    public object Documents { get; set; } = new List<object>();
}
