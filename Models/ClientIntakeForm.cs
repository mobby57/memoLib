namespace MemoLib.Api.Models;

public class ClientIntakeForm
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public List<IntakeFormField> Fields { get; set; } = new();
    public List<string> RequiredDocuments { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class IntakeFormField
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Label { get; set; } = null!;
    public string Type { get; set; } = "text"; // text, email, phone, file, select, checkbox
    public bool Required { get; set; }
    public List<string>? Options { get; set; }
    public string? Placeholder { get; set; }
    public int Order { get; set; }
}

public class ClientIntakeSubmission
{
    public Guid Id { get; set; }
    public Guid FormId { get; set; }
    public Guid? CaseId { get; set; }
    public string ClientEmail { get; set; } = null!;
    public string ClientName { get; set; } = null!;
    public Dictionary<string, object> FormData { get; set; } = new();
    public List<Guid> UploadedDocumentIds { get; set; } = new();
    public string Status { get; set; } = "PENDING"; // PENDING, REVIEWED, APPROVED
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
}

public class SharedWorkspace
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string Name { get; set; } = null!;
    public List<WorkspaceParticipant> Participants { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public class WorkspaceParticipant
{
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Role { get; set; } = "VIEWER"; // OWNER, EDITOR, VIEWER
    public string ParticipantType { get; set; } = "CLIENT"; // CLIENT, LAWYER, JUDGE, SECRETARY, EXPERT
    public DateTime AddedAt { get; set; }
}

public class WorkspaceDocument
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public long FileSize { get; set; }
    public string UploadedBy { get; set; } = null!;
    public string Category { get; set; } = "GENERAL"; // GENERAL, EVIDENCE, CONTRACT, COURT_FILING
    public DateTime UploadedAt { get; set; }
    public List<string> VisibleToRoles { get; set; } = new();
}

public class WorkspaceActivity
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string ActorEmail { get; set; } = null!;
    public string ActorName { get; set; } = null!;
    public string Action { get; set; } = null!; // DOCUMENT_UPLOADED, COMMENT_ADDED, STATUS_CHANGED
    public string Details { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
}
