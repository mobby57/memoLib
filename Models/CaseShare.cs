namespace MemoLib.Api.Models;

public class CaseShare
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public string SharedWithEmail { get; set; } = null!;
    public string SharedWithName { get; set; } = null!;
    public string Role { get; set; } = "VIEWER"; // VIEWER, EDITOR, COLLABORATOR
    public DateTime SharedAt { get; set; }
    public Guid SharedByUserId { get; set; }
}
