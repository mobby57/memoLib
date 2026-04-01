using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class LegalDeadline : TenantEntity
{
    public Guid CaseId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DeadlineCategory Category { get; set; } = DeadlineCategory.Custom;

    public DateTime Deadline { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DeadlineStatus Status { get; set; } = DeadlineStatus.Pending;

    public bool AlertJ30Sent { get; set; }
    public bool AlertJ7Sent { get; set; }
    public bool AlertJ3Sent { get; set; }
    public bool AlertJ1Sent { get; set; }

    public string? Jurisdiction { get; set; }
    public string? LegalBasis { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? AssignedTo { get; set; }
}

public enum DeadlineCategory
{
    RecoursGracieux,
    RecoursContentieux,
    Appel,
    Cassation,
    OQTF,
    ProductionPieces,
    ConvocationAudience,
    SignificationDecision,
    ExecutionDecision,
    Prescription,
    Custom
}

public enum DeadlineStatus
{
    Pending,
    Approaching,
    Urgent,
    Critical,
    Overdue,
    Completed,
    Cancelled
}
