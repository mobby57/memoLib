namespace MemoLib.Api.Models;

public class Attachment
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }

    public Event? Event { get; set; }
}
