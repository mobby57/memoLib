using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public Guid? TenantId { get; set; }
    public string Action { get; set; } = null!;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? Metadata { get; set; }
    public DateTime OccurredAt { get; set; }

    // Navigation
    public User? User { get; set; }
}
