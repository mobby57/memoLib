using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;
using System.Text.RegularExpressions;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SecureSearchController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<SecureSearchController> _logger;
    private static readonly Regex SafeSearchPattern = new(@"^[a-zA-Z0-9\s\-_.@]+$", RegexOptions.Compiled);

    public SecureSearchController(MemoLibDbContext context, ILogger<SecureSearchController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("events")]
    public async Task<IActionResult> SearchEvents([FromBody] SearchEventsRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        // Validation et sanitisation de l'entrée de recherche
        if (!string.IsNullOrWhiteSpace(request.Text))
        {
            if (request.Text.Length > 100)
            {
                return BadRequest(new { message = "Recherche trop longue (max 100 caractères)" });
            }

            if (!SafeSearchPattern.IsMatch(request.Text))
            {
                _logger.LogWarning("Tentative de recherche avec caractères suspects: {Text} par {UserId}", request.Text, userId);
                return BadRequest(new { message = "Caractères non autorisés dans la recherche" });
            }
        }

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
            var sanitizedText = request.Text.Trim();
            query = query.Where(e => e.RawPayload.Contains(sanitizedText));
        }

        if (request.From.HasValue)
        {
            query = query.Where(e => e.OccurredAt >= request.From.Value);
        }

        if (request.To.HasValue)
        {
            query = query.Where(e => e.OccurredAt <= request.To.Value);
        }

        if (request.SourceId.HasValue)
        {
            query = query.Where(e => e.SourceId == request.SourceId.Value);
        }

        var results = await query
            .OrderByDescending(e => e.OccurredAt)
            .Take(50) // Limiter les résultats
            .ToListAsync();

        _logger.LogInformation("Recherche effectuée par {UserId}: {Text}, {Count} résultats", 
            userId, request.Text ?? "vide", results.Count);

        return Ok(results);
    }
}