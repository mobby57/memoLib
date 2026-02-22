using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;
using System.Text.Json;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/semantic")]
public class SemanticController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly EmbeddingService _embeddingService;

    public SemanticController(MemoLibDbContext context, EmbeddingService embeddingService)
    {
        _context = context;
        _embeddingService = embeddingService;
    }

    [HttpPost("generate-embeddings")]
    public async Task<IActionResult> GenerateEmbeddings()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var events = await _context.Events
            .Where(e => userSourceIds.Contains(e.SourceId))
            .Where(e => e.TextForEmbedding != null && e.EmbeddingVector == null)
            .ToListAsync();

        int count = 0;
        foreach (var ev in events)
        {
            var embedding = _embeddingService.GenerateEmbedding(ev.TextForEmbedding!);
            ev.EmbeddingVector = JsonSerializer.Serialize(embedding);
            count++;
        }

        if (count > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { GeneratedCount = count });
    }

    [HttpPost("search")]
    public async Task<IActionResult> SemanticSearch([FromBody] SearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query required");

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
            .Where(e => e.EmbeddingVector != null && !string.IsNullOrEmpty(e.EmbeddingVector))
            .ToListAsync();

        var results = new List<dynamic>();

        foreach (var ev in events)
        {
            try
            {
                var eventEmbedding = JsonSerializer.Deserialize<Dictionary<string, double>>(ev.EmbeddingVector);
                if (eventEmbedding == null)
                    continue;

                var similarity = _embeddingService.CalculateSimilarity(queryEmbedding, eventEmbedding);

                if (similarity > 0.1)
                {
                    results.Add(new
                    {
                        ev.Id,
                        ev.TextForEmbedding,
                        Similarity = Math.Round(similarity, 4)
                    });
                }
            }
            catch
            {
                // Skip if embedding is malformed
            }
        }

        var sorted = results
            .OrderByDescending(r => r.Similarity)
            .Take(20)
            .ToList();

        return Ok(sorted);
    }

    public class SearchRequest
    {
        public string Query { get; set; } = null!;
    }
}
