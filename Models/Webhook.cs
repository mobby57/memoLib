using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Webhook : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Url { get; set; } = null!;
    public string Event { get; set; } = null!;
    public string Secret { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime? LastTriggeredAt { get; set; }
    public int TriggerCount { get; set; }

    // Navigation
    public User? User { get; set; }
    public ICollection<WebhookLog> Logs { get; set; } = new List<WebhookLog>();
}

public class WebhookLog : BaseEntity
{
    public Guid WebhookId { get; set; }
    public string Event { get; set; } = null!;
    public string Payload { get; set; } = null!;
    public int StatusCode { get; set; }
    public string? Response { get; set; }
    public bool Success { get; set; }
    public DateTime TriggeredAt { get; set; }

    // Navigation
    public Webhook? Webhook { get; set; }
}
