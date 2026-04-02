using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class EmailVerificationToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsUsed => ConfirmedAt.HasValue;

    public User User { get; set; } = null!;
}
