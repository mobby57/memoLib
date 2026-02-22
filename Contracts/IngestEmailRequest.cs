namespace MemoLib.Api.Contracts;

public class IngestEmailRequest
{
    public string ExternalId { get; set; } = null!;
    public string From { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string Body { get; set; } = null!;
    public DateTime OccurredAt { get; set; }
}
