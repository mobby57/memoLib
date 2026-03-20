using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Case : TenantEntity
{
    public Guid? UserId { get; set; }
    public Guid? ClientId { get; set; }
    public string Title { get; set; } = null!;
    public string Status { get; set; } = "OPEN";
    public Guid? AssignedToUserId { get; set; }
    public string? Tags { get; set; }
    public int Priority { get; set; } = 0;
    public DateTime? DueDate { get; set; }
    public DateTime? ClosedAt { get; set; }

    // Navigation
    public User? Owner { get; set; }
    public User? AssignedTo { get; set; }
    public Client? Client { get; set; }
    public ICollection<CaseEvent> CaseEvents { get; set; } = new List<CaseEvent>();
    public ICollection<CaseActivity> Activities { get; set; } = new List<CaseActivity>();
    public ICollection<CaseComment> Comments { get; set; } = new List<CaseComment>();
    public ICollection<CaseNote> Notes { get; set; } = new List<CaseNote>();
    public ICollection<CaseCollaborator> Collaborators { get; set; } = new List<CaseCollaborator>();
    public ICollection<CaseTask> Tasks { get; set; } = new List<CaseTask>();
    public ICollection<CaseDocument> Documents { get; set; } = new List<CaseDocument>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<CalendarEvent> CalendarEvents { get; set; } = new List<CalendarEvent>();
}
