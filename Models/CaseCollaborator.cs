namespace MemoLib.Api.Models;

public class CaseCollaborator
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "VIEWER"; // OWNER, COLLABORATOR, VIEWER
    public bool CanEdit { get; set; } = false;
    public bool CanComment { get; set; } = true;
    public bool CanViewDocuments { get; set; } = true;
    public bool CanUploadDocuments { get; set; } = false;
    public bool CanInviteOthers { get; set; } = false;
    public bool ReceiveNotifications { get; set; } = true;
    public DateTime AddedAt { get; set; }
    public Guid AddedByUserId { get; set; }
}
