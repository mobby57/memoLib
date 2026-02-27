namespace MemoLib.Api.Models;

public class Client
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Phone
    {
        get => PhoneNumber;
        set => PhoneNumber = value;
    }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
}
