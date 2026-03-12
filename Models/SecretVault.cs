namespace MemoLib.Api.Models;

public class SecretVault
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string EncryptedValue { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Email, Database, API, etc.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
