using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class RoleNotification : TenantEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? CaseId { get; set; }
    public string Severity { get; set; } = "LOW";
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public Case? Case { get; set; }
}
