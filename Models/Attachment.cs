namespace MemoLib.Api.Models;

public class Attachment
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string? Checksum { get; set; }
    public DateTime UploadedAt { get; set; }

    public Event? Event { get; set; }

    public const long MaxFileSize = 10 * 1024 * 1024; // 10 Mo
    public static readonly HashSet<string> BlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".scr", ".bat", ".cmd", ".com", ".pif", ".vbs", ".js", ".msi", ".dll"
    };
}
