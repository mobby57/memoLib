namespace MemoLib.Api.Models;

public class Source
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public Guid UserId { get; set; }
}
