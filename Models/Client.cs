using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Client : TenantEntity
{
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

    // Navigation
    public User? User { get; set; }
    public ICollection<Case> Cases { get; set; } = new List<Case>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
