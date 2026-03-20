using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class CaseActivity : BaseEntity
{
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string ActivityType { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Metadata { get; set; }
    public DateTime OccurredAt { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? User { get; set; }
}
