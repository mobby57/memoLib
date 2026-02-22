namespace MemoLib.Api.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? EventId { get; set; }
    public string Type { get; set; } = null!; // WARNING, ERROR, INFO
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? ActionRequired { get; set; }
    public bool IsRead { get; set; }
    public bool IsResolved { get; set; }
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
