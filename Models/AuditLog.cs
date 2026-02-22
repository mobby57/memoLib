namespace MemoLib.Api.Models;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = null!;
    public string? Metadata { get; set; }
    public DateTime OccurredAt { get; set; }
}
