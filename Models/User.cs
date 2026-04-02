using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class User : AuditableEntity
{
    public Guid? TenantId { get; set; }
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
    public bool IsEmailVerified { get; set; }

    // Navigation
    public Tenant? Tenant { get; set; }
    public ICollection<Case> OwnedCases { get; set; } = new List<Case>();
    public ICollection<Case> AssignedCases { get; set; } = new List<Case>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<EmailTemplate> EmailTemplates { get; set; } = new List<EmailTemplate>();
    public UserEmailConfig? EmailConfig { get; set; }
    public UserAutomationSettings? AutomationSettings { get; set; }
}
