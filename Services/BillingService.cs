using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class BillingService
{
    private readonly MemoLibDbContext _context;

    public BillingService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<TimeEntry> StartTimerAsync(Guid caseId, Guid userId, string description, decimal hourlyRate)
    {
        var entry = new TimeEntry
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            StartTime = DateTime.UtcNow,
            Description = description,
            HourlyRate = hourlyRate
        };

        _context.Set<TimeEntry>().Add(entry);
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<TimeEntry> StopTimerAsync(Guid entryId)
    {
        var entry = await _context.Set<TimeEntry>().FindAsync(entryId);
        if (entry == null) throw new Exception("TimeEntry not found");

        entry.EndTime = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<Invoice> GenerateInvoiceAsync(Guid caseId, Guid clientId)
    {
        var timeEntries = await _context.Set<TimeEntry>()
            .Where(t => t.CaseId == caseId && t.IsBillable && t.EndTime != null)
            .ToListAsync();

        var totalAmount = timeEntries.Sum(t => t.Amount);
        var taxAmount = totalAmount * 0.20m; // TVA 20%

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            ClientId = clientId,
            InvoiceNumber = $"INV-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            TotalAmount = totalAmount,
            TaxAmount = taxAmount,
            Status = "draft",
            TimeEntries = timeEntries
        };

        _context.Set<Invoice>().Add(invoice);
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<List<TimeEntry>> GetCaseTimeEntriesAsync(Guid caseId)
    {
        return await _context.Set<TimeEntry>()
            .Where(t => t.CaseId == caseId)
            .OrderByDescending(t => t.StartTime)
            .ToListAsync();
    }
}