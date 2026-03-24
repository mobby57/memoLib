using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class HearingService
{
    private readonly MemoLibDbContext _db;

    public HearingService(MemoLibDbContext db) => _db = db;

    public async Task<List<Hearing>> GetByCaseAsync(Guid caseId) =>
        await _db.Set<Hearing>()
            .Where(h => h.CaseId == caseId && !h.IsDeleted)
            .OrderBy(h => h.Date)
            .ToListAsync();

    public async Task<List<Hearing>> GetUpcomingAsync(Guid userId, int days = 30) =>
        await _db.Set<Hearing>()
            .Include(h => h.Case)
            .Where(h => !h.IsDeleted
                && h.Status != HearingStatus.Cancelled
                && h.Date >= DateTime.UtcNow
                && h.Date <= DateTime.UtcNow.AddDays(days))
            .OrderBy(h => h.Date)
            .ToListAsync();

    public async Task<Hearing> CreateAsync(Hearing hearing)
    {
        hearing.Id = Guid.NewGuid();
        _db.Set<Hearing>().Add(hearing);
        await _db.SaveChangesAsync();
        return hearing;
    }

    public async Task<Hearing?> UpdateAsync(Guid id, Action<Hearing> update)
    {
        var h = await _db.Set<Hearing>().FindAsync(id);
        if (h == null) return null;
        update(h);
        h.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return h;
    }

    public async Task<Hearing?> UpdateStatusAsync(Guid id, HearingStatus status, string? outcome = null)
    {
        var h = await _db.Set<Hearing>().FindAsync(id);
        if (h == null) return null;
        h.Status = status;
        if (outcome != null) h.Outcome = outcome;
        h.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return h;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var h = await _db.Set<Hearing>().FindAsync(id);
        if (h == null) return false;
        h.IsDeleted = true;
        h.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }
}
