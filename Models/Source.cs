using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Source : BaseEntity
{
    public string Type { get; set; } = null!;
    public Guid UserId { get; set; }

    // Navigation
    public User? User { get; set; }
    public ICollection<Event> Events { get; set; } = new List<Event>();
}
