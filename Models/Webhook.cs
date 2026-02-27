namespace MemoLib.Api.Models;

public class Webhook
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Url { get; set; } = null!;
    public string Event { get; set; } = null!; // CASE_CREATED, MESSAGE_RECEIVED, STATUS_CHANGED, etc.
    public string Secret { get; set; } = null!; // Pour signature HMAC
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastTriggeredAt { get; set; }
    public int TriggerCount { get; set; }
}

public class WebhookLog
{
    public Guid Id { get; set; }
    public Guid WebhookId { get; set; }
    public string Event { get; set; } = null!;
    public string Payload { get; set; } = null!;
    public int StatusCode { get; set; }
    public string? Response { get; set; }
    public bool Success { get; set; }
    public DateTime TriggeredAt { get; set; }
}
