namespace MemoLib.Api.Models;

public class Case
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public Guid? ClientId { get; set; }
    public string Title { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "OPEN";
    public Guid? AssignedToUserId { get; set; }
    public string? Tags { get; set; }
    public int Priority { get; set; } = 0;
    public DateTime? DueDate { get; set; }
    public DateTime? ClosedAt { get; set; }
}
