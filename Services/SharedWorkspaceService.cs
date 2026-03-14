using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class SharedWorkspaceService
{
    private readonly MemoLibDbContext _context;

    public SharedWorkspaceService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<List<SharedWorkspace>> GetWorkspacesByCaseAsync(Guid caseId)
    {
        return await _context.SharedWorkspaces
            .Where(w => w.CaseId == caseId && w.IsActive)
            .ToListAsync();
    }

    public async Task<SharedWorkspace?> GetByIdAsync(Guid id)
    {
        return await _context.SharedWorkspaces.FindAsync(id);
    }

    public async Task<SharedWorkspace> CreateAsync(Guid caseId, string name, WorkspaceParticipant owner)
    {
        var workspace = new SharedWorkspace
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            Name = name,
            Participants = new List<WorkspaceParticipant> { owner },
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.SharedWorkspaces.Add(workspace);
        await _context.SaveChangesAsync();
        return workspace;
    }

    public async Task<bool> AddParticipantAsync(Guid workspaceId, WorkspaceParticipant participant)
    {
        var workspace = await _context.SharedWorkspaces.FindAsync(workspaceId);
        if (workspace == null) return false;

        if (workspace.Participants.Any(p => p.Email == participant.Email))
            return false; // déjà participant

        participant.AddedAt = DateTime.UtcNow;
        workspace.Participants.Add(participant);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveParticipantAsync(Guid workspaceId, string email)
    {
        var workspace = await _context.SharedWorkspaces.FindAsync(workspaceId);
        if (workspace == null) return false;

        var participant = workspace.Participants.FirstOrDefault(p => p.Email == email);
        if (participant == null) return false;

        workspace.Participants.Remove(participant);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeactivateAsync(Guid workspaceId)
    {
        var workspace = await _context.SharedWorkspaces.FindAsync(workspaceId);
        if (workspace == null) return false;

        workspace.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<WorkspaceDocument>> GetDocumentsAsync(Guid workspaceId)
    {
        return await _context.WorkspaceDocuments
            .Where(d => d.WorkspaceId == workspaceId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }

    public async Task<WorkspaceDocument> AddDocumentAsync(WorkspaceDocument document)
    {
        document.Id = Guid.NewGuid();
        document.UploadedAt = DateTime.UtcNow;
        _context.WorkspaceDocuments.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<List<WorkspaceActivity>> GetActivitiesAsync(Guid workspaceId)
    {
        return await _context.WorkspaceActivities
            .Where(a => a.WorkspaceId == workspaceId)
            .OrderByDescending(a => a.OccurredAt)
            .ToListAsync();
    }

    public async Task LogActivityAsync(Guid workspaceId, string actorEmail, string actorName, string action, string details = "")
    {
        _context.WorkspaceActivities.Add(new WorkspaceActivity
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ActorEmail = actorEmail,
            ActorName = actorName,
            Action = action,
            Details = details,
            OccurredAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }
}
