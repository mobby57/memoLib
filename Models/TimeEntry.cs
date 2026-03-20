using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class TimeEntry : TenantEntity
{
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public string ActivityType { get; set; } = "consultation";
    public bool IsBillable { get; set; } = true;
    public bool IsInvoiced { get; set; }
    public Guid? InvoiceId { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Amount { get; set; }

    public decimal Duration => EndTime.HasValue
        ? (decimal)(EndTime.Value - StartTime).TotalHours
        : 0;

    // Navigation
    public Case? Case { get; set; }
    public User? User { get; set; }
    public Invoice? Invoice { get; set; }
}

public class Invoice : TenantEntity
{
    public Guid CaseId { get; set; }
    public Guid ClientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }

    public decimal TotalAmount
    {
        get => Subtotal;
        set => Subtotal = value;
    }

    public decimal TaxAmount
    {
        get => Tax;
        set => Tax = value;
    }

    public decimal TotalWithTax => Total > 0 ? Total : Subtotal + Tax;

    public string Status { get; set; } = "draft";
    public DateTime? SentAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public Client? Client { get; set; }
    public List<TimeEntry> TimeEntries { get; set; } = new();
    public List<InvoiceItem> Items { get; set; } = new();
}

public class InvoiceItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public Guid? TimeEntryId { get; set; }

    // Navigation
    public Invoice? Invoice { get; set; }
    public TimeEntry? TimeEntry { get; set; }
}
