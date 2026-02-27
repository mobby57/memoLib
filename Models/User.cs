namespace MemoLib.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string? Name { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; } = "AGENT";
    public string? Phone { get; set; }
    public string? FirmName { get; set; }
    public string? BarNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Plan { get; set; } = "CABINET";
    public DateTime CreatedAt { get; set; }
}
