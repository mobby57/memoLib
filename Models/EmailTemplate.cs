using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class EmailTemplate : TenantEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string Body { get; set; } = null!;

    // Navigation
    public User? User { get; set; }
}
