using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class ClientIntakeForm : TenantEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public List<IntakeFormField> Fields { get; set; } = new();
    public List<string> RequiredDocuments { get; set; } = new();
    public bool IsActive { get; set; } = true;

    // Navigation
    public User? User { get; set; }
    public ICollection<ClientIntakeSubmission> Submissions { get; set; } = new List<ClientIntakeSubmission>();
}

public class IntakeFormField
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Label { get; set; } = null!;
    public string Type { get; set; } = "text";
    public bool Required { get; set; }
    public List<string>? Options { get; set; }
    public string? Placeholder { get; set; }
    public int Order { get; set; }
}

public class ClientIntakeSubmission : AuditableEntity
{
    public Guid FormId { get; set; }
    public Guid? CaseId { get; set; }
    public string ClientEmail { get; set; } = null!;
    public string ClientName { get; set; } = null!;
    public Dictionary<string, object> FormData { get; set; } = new();
    public List<Guid> UploadedDocumentIds { get; set; } = new();
    public string Status { get; set; } = "PENDING";
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }

    // Navigation
    public ClientIntakeForm? Form { get; set; }
    public Case? Case { get; set; }
    public User? ReviewedBy { get; set; }
}

public class SharedWorkspace : TenantEntity
{
    public Guid CaseId { get; set; }
    public string Name { get; set; } = null!;
    public List<WorkspaceParticipant> Participants { get; set; } = new();
    public bool IsActive { get; set; } = true;

    // Navigation
    public Case? Case { get; set; }
    public ICollection<WorkspaceDocument> Documents { get; set; } = new List<WorkspaceDocument>();
    public ICollection<WorkspaceActivity> Activities { get; set; } = new List<WorkspaceActivity>();
}

public class WorkspaceParticipant
{
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Role { get; set; } = "VIEWER";
    public string ParticipantType { get; set; } = "CLIENT";
    public DateTime AddedAt { get; set; }
}

public class WorkspaceDocument : SoftDeletableEntity
{
    public Guid WorkspaceId { get; set; }
    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public long FileSize { get; set; }
    public string UploadedBy { get; set; } = null!;
    public string Category { get; set; } = "GENERAL";
    public DateTime UploadedAt { get; set; }
    public List<string> VisibleToRoles { get; set; } = new();

    // Navigation
    public SharedWorkspace? Workspace { get; set; }
}

public class WorkspaceActivity : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public string ActorEmail { get; set; } = null!;
    public string ActorName { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string Details { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }

    // Navigation
    public SharedWorkspace? Workspace { get; set; }
}
