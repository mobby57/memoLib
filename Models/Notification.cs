using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Notification : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid? EventId { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? RelatedEntityId { get; set; }
    public string? ActionRequired { get; set; }
    public bool IsRead { get; set; }
    public bool IsResolved { get; set; }
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public Event? Event { get; set; }
}
