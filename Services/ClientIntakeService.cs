using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class ClientIntakeService
{
    private readonly MemoLibDbContext _context;

    public ClientIntakeService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<ClientIntakeForm> CreateFormTemplateAsync(Guid userId, ClientIntakeForm form)
    {
        form.Id = Guid.NewGuid();
        form.UserId = userId;
        form.CreatedAt = DateTime.UtcNow;

        _context.ClientIntakeForms.Add(form);
        await _context.SaveChangesAsync();

        return form;
    }

    public async Task<List<ClientIntakeForm>> GetUserFormsAsync(Guid userId)
    {
        return await _context.ClientIntakeForms
            .Where(f => f.UserId == userId && f.IsActive)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClientIntakeForm?> GetFormByIdAsync(Guid formId)
    {
        return await _context.ClientIntakeForms.FindAsync(formId);
    }

    public async Task<ClientIntakeSubmission> SubmitFormAsync(ClientIntakeSubmission submission)
    {
        submission.Id = Guid.NewGuid();
        submission.SubmittedAt = DateTime.UtcNow;

        _context.ClientIntakeSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return submission;
    }

    public async Task<List<ClientIntakeSubmission>> GetPendingSubmissionsAsync(Guid userId)
    {
        var userForms = await _context.ClientIntakeForms
            .Where(f => f.UserId == userId)
            .Select(f => f.Id)
            .ToListAsync();

        return await _context.ClientIntakeSubmissions
            .Where(s => userForms.Contains(s.FormId) && s.Status == "PENDING")
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
    }
}

public class SharedWorkspaceService
{
    private readonly MemoLibDbContext _context;

    public SharedWorkspaceService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<SharedWorkspace> CreateWorkspaceAsync(Guid caseId, string name, List<WorkspaceParticipant> participants)
    {
        var workspace = new SharedWorkspace
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            Name = name,
            Participants = participants,
            CreatedAt = DateTime.UtcNow
        };

        _context.SharedWorkspaces.Add(workspace);
        await _context.SaveChangesAsync();

        return workspace;
    }

    public async Task<SharedWorkspace?> GetWorkspaceByCaseIdAsync(Guid caseId)
    {
        return await _context.SharedWorkspaces
            .FirstOrDefaultAsync(w => w.CaseId == caseId && w.IsActive);
    }

    public async Task<WorkspaceDocument> UploadDocumentAsync(WorkspaceDocument document)
    {
        document.Id = Guid.NewGuid();
        document.UploadedAt = DateTime.UtcNow;

        _context.WorkspaceDocuments.Add(document);
        await _context.SaveChangesAsync();

        await LogActivityAsync(document.WorkspaceId, document.UploadedBy, document.UploadedBy, 
            "DOCUMENT_UPLOADED", $"Uploaded {document.FileName}");

        return document;
    }

    public async Task<List<WorkspaceDocument>> GetWorkspaceDocumentsAsync(Guid workspaceId, string userRole)
    {
        return await _context.WorkspaceDocuments
            .Where(d => d.WorkspaceId == workspaceId && 
                       (d.VisibleToRoles.Count == 0 || d.VisibleToRoles.Contains(userRole)))
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }

    public async Task<List<WorkspaceActivity>> GetWorkspaceActivitiesAsync(Guid workspaceId, int limit = 50)
    {
        return await _context.WorkspaceActivities
            .Where(a => a.WorkspaceId == workspaceId)
            .OrderByDescending(a => a.OccurredAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task LogActivityAsync(Guid workspaceId, string actorEmail, string actorName, string action, string details)
    {
        var activity = new WorkspaceActivity
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ActorEmail = actorEmail,
            ActorName = actorName,
            Action = action,
            Details = details,
            OccurredAt = DateTime.UtcNow
        };

        _context.WorkspaceActivities.Add(activity);
        await _context.SaveChangesAsync();
    }
}
