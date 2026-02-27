namespace MemoLib.Api.Models;

public class CaseNote
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public List<string> Mentions { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class CaseTask
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public DateTime? DueDate { get; set; }
    public int Priority { get; set; } = 3;
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
}

public class CaseDocument
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = "application/octet-stream";
    public string? Description { get; set; }
    public int Version { get; set; } = 1;
    public Guid? ParentDocumentId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? Category { get; set; }
    public List<string> Tags { get; set; } = new();
}

public class PhoneCall
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid? ClientId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Direction { get; set; } = "INCOMING";
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public int DurationSeconds { get; set; }
    public string? Notes { get; set; }
    public string? RecordingUrl { get; set; }
    public string? Transcription { get; set; }
    public Guid HandledByUserId { get; set; }
}

public class CustomForm
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<FormField> Fields { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Automation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TriggerType { get; set; } = string.Empty;
    public Dictionary<string, string> TriggerConditions { get; set; } = new();
    public string ActionType { get; set; } = string.Empty;
    public Dictionary<string, string> ActionParams { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Report
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public Dictionary<string, string> Filters { get; set; } = new();
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public string? ExportUrl { get; set; }
}

public class Integration
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public Dictionary<string, string> Settings { get; set; } = new();
}

public class TeamMessage
{
    public Guid Id { get; set; }
    public Guid FromUserId { get; set; }
    public Guid? ToUserId { get; set; }
    public Guid? CaseId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class ExternalShare
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string ShareToken { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public List<Guid> DocumentIds { get; set; } = new();
    public bool AllowDownload { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public string? Password { get; set; }
    public Guid SharedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AccessedAt { get; set; }
}