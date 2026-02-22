using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Models;
using MemoLib.Api.Data;
using System.Text.RegularExpressions;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/[controller]")]
public class ClientController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<ClientController> _logger;

    public ClientController(MemoLibDbContext context, ILogger<ClientController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ClientResponse>> CreateClient(CreateClientRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized client creation attempt");
            return Unauthorized(new { message = "Utilisateur non authentifié" });
        }

        var existingClient = await _context.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Email.ToLower() == request.Email.ToLower());

        if (existingClient != null)
        {
            _logger.LogWarning("Duplicate client detected: {Email} for user: {UserId}", request.Email, userId);
            return Conflict(new { 
                message = "Un client avec cet email existe déjà",
                existingClientId = existingClient.Id
            });
        }

        _logger.LogInformation("Creating client: {Name} for user: {UserId}", request.Name, userId);

        var client = new Client
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Client created successfully: {ClientId} by user: {UserId}", client.Id, userId);

        return CreatedAtAction(nameof(GetClient), new { id = client.Id }, new ClientResponse
        {
            Id = client.Id,
            Name = client.Name,
            Email = client.Email,
            PhoneNumber = client.PhoneNumber,
            Address = client.Address,
            CreatedAt = client.CreatedAt
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClientResponse>> GetClient(Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized client access attempt for client: {ClientId}", id);
            return Unauthorized(new { message = "Utilisateur non authentifié" });
        }

        var client = await _context.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        
        if (client == null)
        {
            _logger.LogWarning("Client not found: {ClientId} for user: {UserId}", id, userId);
            return NotFound();
        }

        return new ClientResponse
        {
            Id = client.Id,
            Name = client.Name,
            Email = client.Email,
            PhoneNumber = client.PhoneNumber,
            Address = client.Address,
            CreatedAt = client.CreatedAt
        };
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientResponse>>> GetAllClients()
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized clients list access attempt");
            return Unauthorized(new { message = "Utilisateur non authentifié" });
        }

        var clients = await _context.Clients
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(100)
            .Select(c => new ClientResponse
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                PhoneNumber = c.PhoneNumber,
                Address = c.Address,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} clients for user: {UserId}", clients.Count, userId);

        return Ok(clients);
    }

    [HttpGet("{id}/detail")]
    public async Task<IActionResult> GetClientDetail(Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized client detail access attempt for client: {ClientId}", id);
            return Unauthorized(new { message = "Utilisateur non authentifié" });
        }

        var client = await _context.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (client == null)
            return NotFound(new { message = "Client introuvable" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var recentEvents = await _context.Events
            .AsNoTracking()
            .Where(e => userSourceIds.Contains(e.SourceId))
            .Where(e => EF.Functions.Like(e.RawPayload, $"%{client.Email}%"))
            .OrderByDescending(e => e.OccurredAt)
            .Take(80)
            .Select(e => new
            {
                e.Id,
                e.ExternalId,
                e.OccurredAt,
                e.RawPayload,
                e.ValidationFlags,
                e.RequiresAttention
            })
            .ToListAsync();

        var eventIds = recentEvents.Select(e => e.Id).ToList();

        var relatedCaseIdsByEvents = await _context.CaseEvents
            .AsNoTracking()
            .Where(ce => eventIds.Contains(ce.EventId))
            .Select(ce => ce.CaseId)
            .Distinct()
            .ToListAsync();

        var relatedCaseIdsByClient = await _context.Cases
            .AsNoTracking()
            .Where(c => c.UserId == userId && c.ClientId == client.Id)
            .Select(c => c.Id)
            .ToListAsync();

        var allCaseIds = relatedCaseIdsByEvents
            .Concat(relatedCaseIdsByClient)
            .Distinct()
            .ToList();

        var relatedCases = await _context.Cases
            .AsNoTracking()
            .Where(c => c.UserId == userId && allCaseIds.Contains(c.Id))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.CreatedAt
            })
            .ToListAsync();

        var annexesCount = 0;
        foreach (var ev in recentEvents)
        {
            var match = Regex.Match(ev.RawPayload ?? string.Empty, "Annexes\\s*:\\s*([^\\n\\r]+)", RegexOptions.IgnoreCase);
            if (!match.Success)
                continue;

            annexesCount += match.Groups[1].Value
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Length;
        }

        return Ok(new
        {
            client = new
            {
                client.Id,
                client.Name,
                client.Email,
                client.PhoneNumber,
                client.Address,
                client.CreatedAt
            },
            summary = new
            {
                relatedCasesCount = relatedCases.Count,
                recentEventsCount = recentEvents.Count,
                openAnomaliesCount = recentEvents.Count(e => e.RequiresAttention),
                totalAnnexesCount = annexesCount,
                lastContactAt = recentEvents.FirstOrDefault()?.OccurredAt
            },
            relatedCases,
            recentEvents
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ClientResponse>> UpdateClient(Guid id, UpdateClientRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized client update attempt for client: {ClientId}", id);
            return Unauthorized(new { message = "Utilisateur non authentifié" });
        }

        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (client == null)
        {
            _logger.LogWarning("Client not found for update: {ClientId} for user: {UserId}", id, userId);
            return NotFound(new { message = "Client introuvable" });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var duplicate = await _context.Clients
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId && c.Id != id && c.Email.ToLower() == normalizedEmail);

        if (duplicate)
        {
            return Conflict(new { message = "Un autre client possède déjà cet email" });
        }

        client.Name = request.Name.Trim();
        client.Email = normalizedEmail;
        client.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        client.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();

        await _context.SaveChangesAsync();

        _logger.LogInformation("Client updated successfully: {ClientId} by user: {UserId}", id, userId);

        return Ok(new ClientResponse
        {
            Id = client.Id,
            Name = client.Name,
            Email = client.Email,
            PhoneNumber = client.PhoneNumber,
            Address = client.Address,
            CreatedAt = client.CreatedAt
        });
    }
}

public class CreateClientRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
}

public class ClientResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateClientRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
}
