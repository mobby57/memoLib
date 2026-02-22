namespace MemoLib.Api.Models;

public class EmailTemplate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string Body { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
