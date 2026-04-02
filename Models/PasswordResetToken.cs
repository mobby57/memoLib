using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class PasswordResetToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}
