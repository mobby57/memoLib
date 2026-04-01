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
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public BillingController(MemoLibDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // Time Entries
    [HttpPost("time-entries")]
    public async Task<IActionResult> StartTimeEntry([FromBody] StartTimeRequest request)
    {
        var userId = GetUserId();

        var entry = new TimeEntry
        {
            Id = Guid.NewGuid(),
            CaseId = request.CaseId,
            UserId = userId,
            StartTime = DateTime.UtcNow,
            Description = request.Description,
            HourlyRate = request.HourlyRate,
            IsBillable = request.IsBillable
        };

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        return Ok(entry);
    }

    [HttpPut("time-entries/{id}/stop")]
    public async Task<IActionResult> StopTimeEntry(Guid id)
    {
        var userId = GetUserId();
        var entry = await _context.TimeEntries.FindAsync(id);

        if (entry == null || entry.UserId != userId)
            return Forbid();

        entry.EndTime = DateTime.UtcNow;
        entry.DurationMinutes = (int)(entry.EndTime.Value - entry.StartTime).TotalMinutes;
        entry.Amount = (entry.DurationMinutes / 60m) * entry.HourlyRate;

        await _context.SaveChangesAsync();

        return Ok(entry);
    }

    [HttpGet("time-entries/case/{caseId}")]
    public async Task<IActionResult> GetTimeEntries(Guid caseId)
    {
        var userId = GetUserId();
        var entries = await _context.TimeEntries
            .Where(t => t.CaseId == caseId && t.UserId == userId)
            .OrderByDescending(t => t.StartTime)
            .ToListAsync();

        return Ok(entries);
    }

    // Invoices
    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        var userId = GetUserId();

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            ClientId = request.ClientId,
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8]}",
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            Subtotal = request.Items.Sum(i => i.Amount),
            TaxRate = request.TaxRate,
            Status = "DRAFT",
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        invoice.Tax = invoice.Subtotal * (invoice.TaxRate / 100);
        invoice.Total = invoice.Subtotal + invoice.Tax;

        _context.Invoices.Add(invoice);

        foreach (var item in request.Items)
        {
            _context.InvoiceItems.Add(new InvoiceItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Amount,
                TimeEntryId = item.TimeEntryId
            });
        }

        await _context.SaveChangesAsync();

        return Ok(invoice);
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        var userId = GetUserId();
        var invoices = await _context.Invoices
            .OrderByDescending(i => i.IssueDate)
            .ToListAsync();

        return Ok(invoices);
    }

    [HttpPut("invoices/{id}/status")]
    public async Task<IActionResult> UpdateInvoiceStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null)
            return NotFound();

        invoice.Status = request.Status;
        if (request.Status == "SENT")
            invoice.SentAt = DateTime.UtcNow;
        if (request.Status == "PAID")
            invoice.PaidAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(invoice);
    }
}

public record StartTimeRequest(Guid CaseId, string Description, decimal HourlyRate, bool IsBillable);
public record CreateInvoiceRequest(Guid ClientId, decimal TaxRate, string? Notes, List<InvoiceItemRequest> Items);
public record InvoiceItemRequest(string Description, decimal Quantity, decimal UnitPrice, decimal Amount, Guid? TimeEntryId);
public record UpdateStatusRequest(string Status);
