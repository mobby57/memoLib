using MemoLib.Api.Models;

namespace MemoLib.Api.Services.Integration;

public interface IEmailAdapter
{
    Task<bool> TestConnectionAsync();
    Task<IEnumerable<EmailMessage>> GetNewEmailsAsync();
    Task<bool> SendEmailAsync(EmailMessage email);
    Task<bool> MarkAsReadAsync(string messageId);
}

public class EmailMessage
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string ToEmail { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
    public List<EmailAttachment> Attachments { get; set; } = new();
}

public class EmailAttachment
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
}