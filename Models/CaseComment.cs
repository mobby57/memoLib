using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class CaseComment : SoftDeletableEntity
{
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = null!;
    public Guid? ParentCommentId { get; set; }
    public string? Mentions { get; set; }
    public DateTime? EditedAt { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? User { get; set; }
    public CaseComment? ParentComment { get; set; }
    public ICollection<CaseComment> Replies { get; set; } = new List<CaseComment>();
}
