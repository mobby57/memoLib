using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Authorization;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/collaboration")]
public class CaseCollaborationController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public CaseCollaborationController(MemoLibDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetUserName() => User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown";

    // Ajouter collaborateur
    [HttpPost("collaborators")]
    public async Task<IActionResult> AddCollaborator(Guid caseId, [FromBody] AddCollaboratorRequest request)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var collaborator = new CaseCollaborator
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = request.UserId,
            Role = request.Role,
            CanEdit = request.CanEdit,
            CanComment = request.CanComment,
            CanViewDocuments = request.CanViewDocuments,
            CanUploadDocuments = request.CanUploadDocuments,
            CanInviteOthers = request.CanInviteOthers,
            ReceiveNotifications = request.ReceiveNotifications,
            AddedAt = DateTime.UtcNow,
            AddedByUserId = userId
        };

        _context.CaseCollaborators.Add(collaborator);
        
        await LogActivity(caseId, userId, "COLLABORATOR_ADDED", 
            $"Collaborateur ajouté avec rôle {request.Role}", null, request.UserId.ToString());

        await _context.SaveChangesAsync();
        return Ok(collaborator);
    }

    // Liste collaborateurs
    [HttpGet("collaborators")]
    public async Task<IActionResult> GetCollaborators(Guid caseId)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var collaborators = await _context.CaseCollaborators
            .Where(c => c.CaseId == caseId)
            .Join(_context.Users, c => c.UserId, u => u.Id, (c, u) => new
            {
                c.Id,
                c.UserId,
                UserName = u.Name,
                UserEmail = u.Email,
                c.Role,
                c.CanEdit,
                c.CanComment,
                c.CanViewDocuments,
                c.CanUploadDocuments,
                c.CanInviteOthers,
                c.ReceiveNotifications,
                c.AddedAt
            })
            .ToListAsync();

        return Ok(collaborators);
    }

    // Supprimer collaborateur
    [HttpDelete("collaborators/{collaboratorId}")]
    public async Task<IActionResult> RemoveCollaborator(Guid caseId, Guid collaboratorId)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var collaborator = await _context.CaseCollaborators.FindAsync(collaboratorId);
        if (collaborator == null || collaborator.CaseId != caseId)
            return NotFound();

        _context.CaseCollaborators.Remove(collaborator);
        
        await LogActivity(caseId, userId, "COLLABORATOR_REMOVED", 
            "Collaborateur retiré", collaborator.UserId.ToString(), null);

        await _context.SaveChangesAsync();
        return Ok(new { message = "Collaborateur retiré" });
    }

    // Activités du dossier
    [HttpGet("activities")]
    public async Task<IActionResult> GetActivities(Guid caseId, [FromQuery] int limit = 100)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var activities = await _context.CaseActivities
            .Where(a => a.CaseId == caseId)
            .OrderByDescending(a => a.OccurredAt)
            .Take(limit)
            .ToListAsync();

        return Ok(activities);
    }

    // Mes dossiers (propriétaire + collaborateur)
    [HttpGet("~/api/cases/my-cases")]
    public async Task<IActionResult> GetMyCases()
    {
        var userId = GetUserId();

        // Dossiers dont je suis propriétaire
        var ownedCases = await _context.Cases
            .Where(c => c.UserId == userId)
            .Select(c => new { c.Id, c.Title, c.Status, c.Priority, c.CreatedAt, Role = "OWNER" })
            .ToListAsync();

        // Dossiers où je suis collaborateur
        var collaboratedCases = await _context.CaseCollaborators
            .Where(cc => cc.UserId == userId)
            .Join(_context.Cases, cc => cc.CaseId, c => c.Id, (cc, c) => new
            {
                c.Id,
                c.Title,
                c.Status,
                c.Priority,
                c.CreatedAt,
                cc.Role
            })
            .ToListAsync();

        var allCases = ownedCases.Concat(collaboratedCases).OrderByDescending(c => c.CreatedAt);

        return Ok(allCases);
    }

    // Notifier tous les collaborateurs
    [HttpPost("notify")]
    public async Task<IActionResult> NotifyCollaborators(Guid caseId, [FromBody] NotifyRequest request)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var collaborators = await _context.CaseCollaborators
            .Where(c => c.CaseId == caseId && c.ReceiveNotifications)
            .ToListAsync();

        foreach (var collab in collaborators)
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = collab.UserId,
                Title = request.Title,
                Message = request.Message,
                Type = "CASE_UPDATE",
                RelatedEntityId = caseId.ToString(),
                CreatedAt = DateTime.UtcNow
            });
        }

        await LogActivity(caseId, userId, "NOTIFICATION_SENT", 
            $"Notification envoyée: {request.Title}", null, null);

        await _context.SaveChangesAsync();

        return Ok(new { message = $"{collaborators.Count} collaborateurs notifiés" });
    }

    private Task LogActivity(Guid caseId, Guid userId, string activityType, 
        string description, string? oldValue, string? newValue)
    {
        _context.CaseActivities.Add(new CaseActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            UserName = GetUserName(),
            ActivityType = activityType,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            OccurredAt = DateTime.UtcNow
        });

        return Task.CompletedTask;
    }
}

public record AddCollaboratorRequest(
    Guid UserId,
    string Role,
    bool CanEdit,
    bool CanComment,
    bool CanViewDocuments,
    bool CanUploadDocuments,
    bool CanInviteOthers,
    bool ReceiveNotifications);

public record NotifyRequest(string Title, string Message);
