namespace MemoLib.Api.Models;

public class RoleNotification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // NEW_EMAIL, CASE_ASSIGNED, HIGH_PRIORITY, etc.
    public Guid? CaseId { get; set; }
    public string Severity { get; set; } = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
