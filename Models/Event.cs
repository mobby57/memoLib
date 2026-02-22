namespace MemoLib.Api.Models;

public class Event
{
    public Guid Id { get; set; }
    public Guid SourceId { get; set; }
    public string ExternalId { get; set; } = null!;
    public string Checksum { get; set; } = null!;
    public DateTime OccurredAt { get; set; }
    public DateTime IngestedAt { get; set; }
    public string RawPayload { get; set; } = null!;
    public string? EventType { get; set; }
    public int? Severity { get; set; }
    public string? TextForEmbedding { get; set; }
    public string? EmbeddingVector { get; set; }
    public string? ValidationFlags { get; set; }
    public bool RequiresAttention { get; set; }
}
