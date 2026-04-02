using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class CaseShare : BaseEntity
{
    public Guid CaseId { get; set; }
    public string SharedWithEmail { get; set; } = null!;
    public string SharedWithName { get; set; } = null!;
    public string Role { get; set; } = "VIEWER";
    public DateTime SharedAt { get; set; }
    public Guid SharedByUserId { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? SharedBy { get; set; }
}
