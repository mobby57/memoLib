using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Event : SoftDeletableEntity
{
    public Guid SourceId { get; set; }
    public string ExternalId { get; set; } = null!;
    public string Checksum { get; set; } = null!;
    public DateTime OccurredAt { get; set; }
    public DateTime IngestedAt { get; set; }
    public string RawPayload { get; set; } = null!;
    public string? EventType { get; set; }
    public string? Type
    {
        get => EventType;
        set => EventType = value;
    }
    public int? Severity { get; set; }
    public string? TextForEmbedding { get; set; }
    public string? EmbeddingVector { get; set; }
    public string? ValidationFlags { get; set; }
    public bool RequiresAttention { get; set; }

    // Navigation
    public virtual Source? Source { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<CaseEvent> CaseEvents { get; set; } = new List<CaseEvent>();
}
