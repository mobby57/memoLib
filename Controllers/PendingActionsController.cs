using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/pending-actions")]
public class PendingActionsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public PendingActionsController(MemoLibDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetPendingActions([FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var actions = await _context.PendingActions
            .Where(a => a.UserId == userId && a.Status == "PENDING")
            .OrderBy(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return Ok(new { count = actions.Count, actions });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPendingAction(Guid id)
    {
        var userId = GetUserId();
        var action = await _context.PendingActions
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (action == null)
            return NotFound();

        return Ok(action);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveAction(Guid id, [FromBody] ApproveActionRequest request)
    {
        var userId = GetUserId();
        var action = await _context.PendingActions
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId && a.Status == "PENDING");

        if (action == null)
            return NotFound();

        // Appliquer les décisions utilisateur
        action.UserCreateCase = request.CreateCase;
        action.UserCaseTitle = request.CaseTitle;
        action.UserCreateClient = request.CreateClient;
        action.UserClientName = request.ClientName;
        action.UserLinkToCaseId = request.LinkToCaseId;
        action.UserLinkToClientId = request.LinkToClientId;
        action.UserAssignToUserId = request.AssignToUserId;
        action.UserPriority = request.Priority;
        action.UserTags = request.Tags;
        action.UserNotes = request.Notes;
        action.Status = "APPROVED";
        action.ProcessedAt = DateTime.UtcNow;

        // Exécuter les actions
        if (request.CreateCase)
        {
            var newCase = new Case
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.CaseTitle ?? action.SuggestedCaseTitle ?? "Sans titre",
                Status = "OPEN",
                Priority = request.Priority ?? 0,
                AssignedToUserId = request.AssignToUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Cases.Add(newCase);

            // Lier l'événement au dossier
            _context.CaseEvents.Add(new CaseEvent
            {
                CaseId = newCase.Id,
                EventId = action.EventId
            });

            action.UserLinkToCaseId = newCase.Id;
        }
        else if (request.LinkToCaseId.HasValue)
        {
            // Lier à un dossier existant
            _context.CaseEvents.Add(new CaseEvent
            {
                CaseId = request.LinkToCaseId.Value,
                EventId = action.EventId
            });
        }

        if (request.CreateClient)
        {
            var newClient = new Client
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.ClientName ?? action.SuggestedClientName ?? "Sans nom",
                Email = action.SuggestedClientEmail ?? string.Empty,
                Phone = action.SuggestedClientPhone,
                CreatedAt = DateTime.UtcNow
            };
            _context.Clients.Add(newClient);
            action.UserLinkToClientId = newClient.Id;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Action approuvée et exécutée", action });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectAction(Guid id, [FromBody] RejectActionRequest request)
    {
        var userId = GetUserId();
        var action = await _context.PendingActions
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId && a.Status == "PENDING");

        if (action == null)
            return NotFound();

        action.Status = "REJECTED";
        action.ProcessedAt = DateTime.UtcNow;
        action.UserNotes = request.Reason;

        if (request.MarkAsSpam)
        {
            action.UserMarkAsSpam = true;
            // TODO: Ajouter à la liste noire
        }

        if (request.Archive)
        {
            action.UserArchive = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Action rejetée", action });
    }

    [HttpPost("bulk-approve")]
    public async Task<IActionResult> BulkApprove([FromBody] BulkApproveRequest request)
    {
        var userId = GetUserId();
        var actions = await _context.PendingActions
            .Where(a => request.ActionIds.Contains(a.Id) && a.UserId == userId && a.Status == "PENDING")
            .ToListAsync();

        foreach (var action in actions)
        {
            action.Status = "APPROVED";
            action.ProcessedAt = DateTime.UtcNow;
            action.UserCreateCase = true;
            action.UserCaseTitle = action.SuggestedCaseTitle;
            action.UserCreateClient = action.SuggestCreateClient;
            action.UserClientName = action.SuggestedClientName;

            // Créer dossier
            var newCase = new Case
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = action.SuggestedCaseTitle ?? "Sans titre",
                Status = "OPEN",
                CreatedAt = DateTime.UtcNow
            };
            _context.Cases.Add(newCase);
            _context.CaseEvents.Add(new CaseEvent { CaseId = newCase.Id, EventId = action.EventId });

            // Créer client si suggéré
            if (action.SuggestCreateClient)
            {
                var newClient = new Client
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = action.SuggestedClientName ?? "Sans nom",
                    Email = action.SuggestedClientEmail ?? string.Empty,
                    Phone = action.SuggestedClientPhone,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Clients.Add(newClient);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"{actions.Count} actions approuvées", count = actions.Count });
    }

    [HttpPost("bulk-reject")]
    public async Task<IActionResult> BulkReject([FromBody] BulkRejectRequest request)
    {
        var userId = GetUserId();
        var actions = await _context.PendingActions
            .Where(a => request.ActionIds.Contains(a.Id) && a.UserId == userId && a.Status == "PENDING")
            .ToListAsync();

        foreach (var action in actions)
        {
            action.Status = "REJECTED";
            action.ProcessedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"{actions.Count} actions rejetées", count = actions.Count });
    }
}

public record ApproveActionRequest(
    bool CreateCase,
    string? CaseTitle,
    bool CreateClient,
    string? ClientName,
    Guid? LinkToCaseId,
    Guid? LinkToClientId,
    Guid? AssignToUserId,
    int? Priority,
    string? Tags,
    string? Notes);

public record RejectActionRequest(string? Reason, bool MarkAsSpam, bool Archive);
public record BulkApproveRequest(List<Guid> ActionIds);
public record BulkRejectRequest(List<Guid> ActionIds);
