using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class WorkflowAutomationService
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<WorkflowAutomationService> _logger;

    public WorkflowAutomationService(MemoLibDbContext context, ILogger<WorkflowAutomationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> ExecuteWorkflowAsync(Guid caseId, string trigger, Guid userId)
    {
        var automations = await _context.Automations
            .Where(a => a.UserId == userId && a.IsActive && a.TriggerType == trigger)
            .ToListAsync();

        foreach (var automation in automations)
        {
            try
            {
                await ExecuteActionAsync(caseId, automation, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur workflow automation {AutomationId}", automation.Id);
            }
        }

        return true;
    }

    private async Task ExecuteActionAsync(Guid caseId, Automation automation, Guid userId)
    {
        var case_ = await _context.Cases.FindAsync(caseId);
        if (case_ == null) return;

        switch (automation.ActionType)
        {
            case "SET_PRIORITY":
                if (automation.ActionParams.TryGetValue("priority", out var priority))
                {
                    case_.Priority = int.Parse(priority);
                    await LogActivity(caseId, userId, "PRIORITY_CHANGED", 
                        $"Priorité changée automatiquement à {priority}", 
                        case_.Priority.ToString(), priority);
                }
                break;

            case "ADD_TAG":
                if (automation.ActionParams.TryGetValue("tag", out var tag))
                {
                    var tags = case_.Tags?.Split(',').ToList() ?? new List<string>();
                    if (!tags.Contains(tag))
                    {
                        tags.Add(tag);
                        case_.Tags = string.Join(",", tags);
                        await LogActivity(caseId, userId, "TAG_ADDED", 
                            $"Tag '{tag}' ajouté automatiquement", null, tag);
                    }
                }
                break;

            case "ASSIGN_TO":
                if (automation.ActionParams.TryGetValue("userId", out var assignUserId))
                {
                    case_.AssignedToUserId = Guid.Parse(assignUserId);
                    await LogActivity(caseId, userId, "ASSIGNED", 
                        "Dossier assigné automatiquement", null, assignUserId);
                }
                break;

            case "CHANGE_STATUS":
                if (automation.ActionParams.TryGetValue("status", out var status))
                {
                    var oldStatus = case_.Status;
                    case_.Status = status;
                    await LogActivity(caseId, userId, "STATUS_CHANGED", 
                        $"Statut changé automatiquement", oldStatus, status);
                }
                break;

            case "SEND_NOTIFICATION":
                if (automation.ActionParams.TryGetValue("message", out var message))
                {
                    var collaborators = await _context.CaseCollaborators
                        .Where(c => c.CaseId == caseId && c.ReceiveNotifications)
                        .ToListAsync();

                    foreach (var collab in collaborators)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            Id = Guid.NewGuid(),
                            UserId = collab.UserId,
                            Title = "Notification automatique",
                            Message = message,
                            Type = "WORKFLOW_AUTOMATION",
                            RelatedEntityId = caseId.ToString(),
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
                break;

            case "CREATE_TASK":
                if (automation.ActionParams.TryGetValue("title", out var taskTitle))
                {
                    _context.CaseTasks.Add(new CaseTask
                    {
                        Id = Guid.NewGuid(),
                        CaseId = caseId,
                        Title = taskTitle,
                        Description = automation.ActionParams.GetValueOrDefault("description"),
                        AssignedToUserId = userId,
                        IsCompleted = false,
                        CreatedAt = DateTime.UtcNow
                    });
                    await LogActivity(caseId, userId, "TASK_CREATED", 
                        $"Tâche créée automatiquement: {taskTitle}", null, null);
                }
                break;
        }

        await _context.SaveChangesAsync();
    }

    private async Task LogActivity(Guid caseId, Guid userId, string activityType, 
        string description, string? oldValue, string? newValue)
    {
        var user = await _context.Users.FindAsync(userId);
        _context.CaseActivities.Add(new CaseActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            UserName = user?.Email ?? "System",
            ActivityType = activityType,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            OccurredAt = DateTime.UtcNow
        });
    }
}
