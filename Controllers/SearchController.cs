using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public SearchController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpPost("events")]
    public async Task<IActionResult> SearchEvents([FromBody] SearchEventsRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        if (userSourceIds.Count == 0)
            return Ok(Array.Empty<object>());

        var query = _context.Events
            .AsNoTracking()
            .Where(e => userSourceIds.Contains(e.SourceId));

        if (!string.IsNullOrWhiteSpace(request.Text))
        {
            var normalizedText = request.Text.Trim().ToLower();
            query = query.Where(e =>
                (e.RawPayload != null && e.RawPayload.ToLower().Contains(normalizedText)) ||
                (e.TextForEmbedding != null && e.TextForEmbedding.ToLower().Contains(normalizedText)) ||
                (e.ExternalId != null && e.ExternalId.ToLower().Contains(normalizedText))
            );
        }

        if (request.From.HasValue)
        {
            query = query.Where(e =>
                e.OccurredAt >= request.From.Value);
        }

        if (request.To.HasValue)
        {
            query = query.Where(e =>
                e.OccurredAt <= request.To.Value);
        }

        if (request.SourceId.HasValue)
        {
            query = query.Where(e =>
                e.SourceId == request.SourceId.Value);
        }

        var orderedQuery = query.OrderByDescending(e => e.OccurredAt);

        var results = request.ReturnAll
            ? await orderedQuery.Take(5000).ToListAsync()
            : await orderedQuery
                .Take(Math.Clamp(request.Limit ?? 100, 1, 1000))
                .ToListAsync();

        return Ok(results);
    }
}
