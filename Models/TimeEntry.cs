namespace MemoLib.Api.Models;

public class TimeEntry
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public string ActivityType { get; set; } = "consultation"; // consultation, redaction, audience, recherche
    public bool IsBillable { get; set; } = true;
    
    public decimal Duration => EndTime.HasValue 
        ? (decimal)(EndTime.Value - StartTime).TotalHours 
        : 0;
    
    public decimal Amount => Duration * HourlyRate;
    
    // Navigation
    public Case? Case { get; set; }
    public User? User { get; set; }
}

public class Invoice
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid ClientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalWithTax => TotalAmount + TaxAmount;
    public string Status { get; set; } = "draft"; // draft, sent, paid, overdue
    public string Notes { get; set; } = string.Empty;
    
    // Navigation
    public Case? Case { get; set; }
    public Client? Client { get; set; }
    public List<TimeEntry> TimeEntries { get; set; } = new();
}