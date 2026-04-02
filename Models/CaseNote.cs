using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class CaseNote : TenantEntity
{
    public Guid CaseId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Visibility { get; set; } = "private";
    public Guid AuthorId { get; set; }
    public string? Mentions { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? Author { get; set; }
}
