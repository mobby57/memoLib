using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GdprController : ControllerBase
{
    private readonly MemoLibDbContext _dbContext;
    private readonly GdprAnonymizationService _anonymizationService;
    private readonly ILogger<GdprController> _logger;

    public GdprController(
        MemoLibDbContext dbContext,
        GdprAnonymizationService anonymizationService,
        ILogger<GdprController> logger)
    {
        _dbContext = dbContext;
        _anonymizationService = anonymizationService;
        _logger = logger;
    }

    [HttpPost("smart-anonymize")]
    public async Task<IActionResult> SmartAnonymizeData()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var reversibleService = new ReversibleAnonymizationService(HttpContext.RequestServices.GetRequiredService<IConfiguration>());
        
        var events = await _dbContext.Events
            .Where(e => e.Source != null && e.Source.UserId == userId)
            .ToListAsync();

        var anonymizedData = new List<UsableAnonymizedData>();
        
        foreach (var evt in events)
        {
            if (!string.IsNullOrEmpty(evt.RawPayload))
            {
                var anonymized = reversibleService.AnonymizeForUser(evt.RawPayload, userId);
                
                // Stocker les mappings pour déanonymisation
                evt.RawPayload = anonymized.AnonymizedText;
                evt.ValidationFlags = System.Text.Json.JsonSerializer.Serialize(anonymized.Mappings);
                
                anonymizedData.Add(anonymized);
            }
        }

        await _dbContext.SaveChangesAsync();
        
        // Générer des analytics exploitables
        var analytics = reversibleService.GenerateClientAnalytics(anonymizedData);

        return Ok(new { 
            message = "Données anonymisées de manière exploitable",
            anonymizedEvents = anonymizedData.Count,
            analytics = analytics,
            isReversible = true
        });
    }

    [HttpPost("deanonymize")]
    public async Task<IActionResult> DeanonymizeData([FromBody] DeanonymizeRequest request)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var reversibleService = new ReversibleAnonymizationService(HttpContext.RequestServices.GetRequiredService<IConfiguration>());
        
        var evt = await _dbContext.Events
            .FirstOrDefaultAsync(e => e.Id == request.EventId && e.Source != null && e.Source.UserId == userId);
            
        if (evt == null)
            return NotFound("Événement non trouvé");
            
        if (string.IsNullOrEmpty(evt.ValidationFlags))
            return BadRequest("Aucune donnée d'anonymisation trouvée");
            
        var mappings = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, AnonymizationMapping>>(evt.ValidationFlags);
        if (mappings == null)
            return BadRequest("Mappings d'anonymisation invalides");

        var originalText = reversibleService.DeanonymizeForUser(evt.RawPayload, mappings);
        
        return Ok(new { 
            eventId = evt.Id,
            anonymizedText = evt.RawPayload,
            originalText = originalText
        });
    }
    public async Task<IActionResult> AnonymizeUserData()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        
        // Anonymiser les événements
        var events = await _dbContext.Events
            .Where(e => e.Source != null && e.Source.UserId == userId)
            .ToListAsync();

        var anonymizedCount = 0;
        foreach (var evt in events)
        {
            if (!string.IsNullOrEmpty(evt.RawPayload))
            {
                var anonymized = _anonymizationService.AnonymizeClientData(evt.RawPayload);
                evt.RawPayload = anonymized.AnonymizedText;
                anonymizedCount++;
            }
        }

        // Anonymiser les clients
        var clients = await _dbContext.Clients
            .Where(c => c.UserId == userId)
            .ToListAsync();

        foreach (var client in clients)
        {
            var hash = _anonymizationService.GenerateConsistentHash(client.Email);
            client.Name = $"Client{hash.Substring(0, 6)}";
            client.Email = $"client{hash}@anonymized.local";
            client.PhoneNumber = client.PhoneNumber != null ? $"06{hash.Substring(0, 8)}" : null;
            client.Address = client.Address != null ? $"{hash.Substring(0, 2)} rue Anonyme" : null;
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Données anonymisées pour utilisateur {UserId}: {Count} événements, {ClientCount} clients", 
            userId, anonymizedCount, clients.Count);

        return Ok(new { 
            message = "Données anonymisées avec succès",
            anonymizedEvents = anonymizedCount,
            anonymizedClients = clients.Count
        });
    }

    [HttpGet("compliance-report")]
    public IActionResult GetComplianceReport()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var report = _anonymizationService.GenerateComplianceReport(userId);
        
        return Ok(report);
    }

    [HttpDelete("delete-all-data")]
    public async Task<IActionResult> DeleteAllUserData()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        
        // Supprimer dans l'ordre des dépendances
        var events = await _dbContext.Events.Where(e => e.Source != null && e.Source.UserId == userId).ToListAsync();
        var cases = await _dbContext.Cases.Where(c => c.UserId == userId).ToListAsync();
        var clients = await _dbContext.Clients.Where(c => c.UserId == userId).ToListAsync();
        var sources = await _dbContext.Sources.Where(s => s.UserId == userId).ToListAsync();
        var auditLogs = await _dbContext.AuditLogs.Where(a => a.UserId == userId).ToListAsync();

        _dbContext.Events.RemoveRange(events);
        _dbContext.Cases.RemoveRange(cases);
        _dbContext.Clients.RemoveRange(clients);
        _dbContext.Sources.RemoveRange(sources);
        _dbContext.AuditLogs.RemoveRange(auditLogs);

        await _dbContext.SaveChangesAsync();

        _logger.LogWarning("Suppression complète des données pour utilisateur {UserId}", userId);

        return Ok(new { 
            message = "Toutes les données ont été supprimées (droit à l'oubli)",
            deletedEvents = events.Count,
            deletedCases = cases.Count,
            deletedClients = clients.Count
        });
    }

    [HttpGet("data-export")]
    public async Task<IActionResult> ExportUserData()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        
        var userData = new
        {
            Events = await _dbContext.Events
                .Where(e => e.Source != null && e.Source.UserId == userId)
                .Select(e => new { e.Id, e.RawPayload, e.OccurredAt, e.EventType })
                .ToListAsync(),
            
            Cases = await _dbContext.Cases
                .Where(c => c.UserId == userId)
                .Select(c => new { c.Id, c.Title, c.CreatedAt, c.Status })
                .ToListAsync(),
            
            Clients = await _dbContext.Clients
                .Where(c => c.UserId == userId)
                .Select(c => new { c.Id, c.Name, c.Email, c.CreatedAt })
                .ToListAsync(),
                
            ExportDate = DateTime.UtcNow,
            UserId = userId
        };

        return Ok(userData);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var rawUserId = User.FindFirst("userId")?.Value;
        return !string.IsNullOrWhiteSpace(rawUserId) && Guid.TryParse(rawUserId, out userId);
    }
}

public record AnonymizeRequest(bool IncludeAuditLogs = false);
public record DeleteDataRequest(string Confirmation);
public record DeanonymizeRequest(Guid EventId);