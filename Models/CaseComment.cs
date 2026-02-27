namespace MemoLib.Api.Models;

public class CaseComment
{
    public Guid Id { get; set; }
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = null!;
    public Guid? ParentCommentId { get; set; }
    public string? Mentions { get; set; } // JSON array of user IDs
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
}
