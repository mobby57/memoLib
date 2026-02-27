using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class CaseTasksService
{
    private readonly MemoLibDbContext _context;

    public CaseTasksService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<List<CaseTask>> GetTasksAsync(Guid caseId, Guid userId, bool? completed)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);

        IQueryable<CaseTask> query = _context.CaseTasks
            .AsNoTracking()
            .Where(task => task.CaseId == caseId);

        if (completed.HasValue)
        {
            query = query.Where(task => task.IsCompleted == completed.Value);
        }

        return await query
            .OrderBy(task => task.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(task => task.CreatedAt)
            .ToListAsync();
    }

    public async Task<CaseTask> CreateTaskAsync(Guid caseId, Guid userId, string title, string? description, Guid? assignedToUserId, DateTime? dueDate, int priority)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);

        var task = new CaseTask
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            Title = title,
            Description = description,
            AssignedToUserId = assignedToUserId,
            DueDate = dueDate,
            Priority = Math.Clamp(priority, 1, 5),
            CreatedAt = DateTime.UtcNow,
            IsCompleted = false
        };

        _context.CaseTasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<CaseTask?> CompleteTaskAsync(Guid caseId, Guid taskId, Guid userId)
    {
        var task = await _context.CaseTasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.CaseId == caseId);

        if (task == null)
        {
            return null;
        }

        await EnsureCaseOwnershipAsync(caseId, userId);

        task.IsCompleted = true;
        task.CompletedAt = DateTime.UtcNow;
        task.CompletedByUserId = userId;

        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<bool> DeleteTaskAsync(Guid caseId, Guid taskId, Guid userId)
    {
        var task = await _context.CaseTasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.CaseId == caseId);

        if (task == null)
        {
            return false;
        }

        await EnsureCaseOwnershipAsync(caseId, userId);

        _context.CaseTasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task EnsureCaseOwnershipAsync(Guid caseId, Guid userId)
    {
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists)
        {
            throw new KeyNotFoundException("Dossier introuvable");
        }
    }
}
