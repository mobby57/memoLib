namespace MemoLib.Api.Models;

public class CaseActivity
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string ActivityType { get; set; } = null!; // CREATED, STATUS_CHANGED, PRIORITY_CHANGED, COMMENT_ADDED, DOCUMENT_UPLOADED, ASSIGNED, TAG_ADDED, etc.
    public string Description { get; set; } = null!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Metadata { get; set; } // JSON
    public DateTime OccurredAt { get; set; }
}
