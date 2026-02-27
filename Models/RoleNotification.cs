namespace MemoLib.Api.Models;

public class RoleNotification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // NEW_EMAIL, CASE_ASSIGNED, HIGH_PRIORITY, etc.
    public int? CaseId { get; set; }
    public string Severity { get; set; } = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
