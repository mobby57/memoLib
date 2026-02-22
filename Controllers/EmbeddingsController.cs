using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;
using System.Text.Json;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/embeddings")]
public class EmbeddingsController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly EmbeddingService _embeddingService;

    public EmbeddingsController(MemoLibDbContext context, EmbeddingService embeddingService)
    {
        _context = context;
        _embeddingService = embeddingService;
    }

    [HttpPost("generate-all")]
    public async Task<IActionResult> GenerateAllEmbeddings()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        if (userSourceIds.Count == 0)
            return Ok(new { GeneratedCount = 0, TotalEvents = 0 });

        var events = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId))
            .Where(e => string.IsNullOrEmpty(e.EmbeddingVector))
            .ToListAsync();

        var count = 0;
        foreach (var ev in events)
        {
            if (!string.IsNullOrWhiteSpace(ev.TextForEmbedding))
            {
                var embedding = _embeddingService.GenerateEmbedding(ev.TextForEmbedding);
                ev.EmbeddingVector = JsonSerializer.Serialize(embedding);
                count++;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { GeneratedCount = count, TotalEvents = events.Count });
    }

    [HttpPost("search")]
    public async Task<IActionResult> SemanticSearch([FromBody] SemanticSearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query cannot be empty");

        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var queryEmbedding = _embeddingService.GenerateEmbedding(request.Query);

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        if (userSourceIds.Count == 0)
            return Ok(Array.Empty<object>());

        var events = await _context.Events
            .AsNoTracking()
            .Where(e => userSourceIds.Contains(e.SourceId))
            .Where(e => !string.IsNullOrEmpty(e.EmbeddingVector))
            .ToListAsync();

        var results = new List<dynamic>();

        foreach (var ev in events)
        {
            if (string.IsNullOrEmpty(ev.EmbeddingVector))
                continue;

            var embedding = JsonSerializer.Deserialize<Dictionary<string, double>>(
                ev.EmbeddingVector) ?? new Dictionary<string, double>();

            var similarity = _embeddingService.CalculateSimilarity(queryEmbedding, embedding);

            if (similarity > 0.1)
            {
                results.Add(new
                {
                    ev.Id,
                    Similarity = similarity,
                    Text = ev.TextForEmbedding?.Substring(0, Math.Min(100, ev.TextForEmbedding.Length))
                });
            }
        }

        var limit = request.Limit.GetValueOrDefault(10);
        limit = Math.Clamp(limit, 1, 100);

        var sorted = results
            .OrderByDescending(r => r.Similarity)
            .Take(limit)
            .ToList();

        return Ok(sorted);
    }
}

public class SemanticSearchRequest
{
    public string Query { get; set; } = null!;
    public int? Limit { get; set; }
}
