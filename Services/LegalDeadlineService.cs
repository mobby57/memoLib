using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class LegalDeadlineService
{
    private readonly MemoLibDbContext _db;

    public LegalDeadlineService(MemoLibDbContext db) => _db = db;

    public async Task<List<LegalDeadline>> GetByCaseAsync(Guid caseId) =>
        await _db.Set<LegalDeadline>()
            .Where(d => d.CaseId == caseId && !d.IsDeleted)
            .OrderBy(d => d.Deadline)
            .ToListAsync();

    public async Task<List<LegalDeadline>> GetUpcomingAsync(Guid userId, int days = 30) =>
        await _db.Set<LegalDeadline>()
            .Include(d => d.Case)
            .Where(d => !d.IsDeleted
                && d.Status != DeadlineStatus.Completed
                && d.Status != DeadlineStatus.Cancelled
                && d.Deadline <= DateTime.UtcNow.AddDays(days))
            .OrderBy(d => d.Deadline)
            .ToListAsync();

    public async Task<LegalDeadline> CreateAsync(LegalDeadline deadline)
    {
        deadline.Id = Guid.NewGuid();
        deadline.Status = ComputeStatus(deadline.Deadline);
        _db.Set<LegalDeadline>().Add(deadline);
        await _db.SaveChangesAsync();
        return deadline;
    }

    public async Task<LegalDeadline?> CompleteAsync(Guid id)
    {
        var d = await _db.Set<LegalDeadline>().FindAsync(id);
        if (d == null) return null;
        d.Status = DeadlineStatus.Completed;
        d.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return d;
    }

    public async Task<LegalDeadline?> UpdateAsync(Guid id, Action<LegalDeadline> update)
    {
        var d = await _db.Set<LegalDeadline>().FindAsync(id);
        if (d == null) return null;
        update(d);
        d.Status = d.Status == DeadlineStatus.Completed ? d.Status : ComputeStatus(d.Deadline);
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return d;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var d = await _db.Set<LegalDeadline>().FindAsync(id);
        if (d == null) return false;
        d.IsDeleted = true;
        d.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public static DeadlineStatus ComputeStatus(DateTime deadline)
    {
        var remaining = (deadline - DateTime.UtcNow).TotalDays;
        return remaining switch
        {
            < 0 => DeadlineStatus.Overdue,
            <= 1 => DeadlineStatus.Critical,
            <= 3 => DeadlineStatus.Urgent,
            <= 7 => DeadlineStatus.Approaching,
            _ => DeadlineStatus.Pending
        };
    }
}
