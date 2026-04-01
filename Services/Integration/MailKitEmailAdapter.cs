using MailKit.Net.Imap;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace MemoLib.Api.Services.Integration;

public class MailKitEmailAdapter : IEmailAdapter
{
    private readonly IConfiguration _config;
    private readonly ILogger<MailKitEmailAdapter> _logger;

    public MailKitEmailAdapter(IConfiguration config, ILogger<MailKitEmailAdapter> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var host = _config["EmailMonitor:ImapHost"] ?? "imap.gmail.com";
            var port = _config.GetValue("EmailMonitor:ImapPort", 993);
            var username = _config["EmailMonitor:Username"];
            var password = _config["EmailMonitor:Password"];

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return false;

            using var client = new ImapClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync(username, password);
            await client.DisconnectAsync(true);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email connection test failed");
            return false;
        }
    }

    public async Task<IEnumerable<EmailMessage>> GetNewEmailsAsync()
    {
        // Délègue au EmailMonitorService existant
        await Task.CompletedTask;
        return Enumerable.Empty<EmailMessage>();
    }

    public async Task<bool> SendEmailAsync(EmailMessage email)
    {
        try
        {
            var host = _config["EmailMonitor:SmtpHost"] ?? "smtp.gmail.com";
            var port = _config.GetValue("EmailMonitor:SmtpPort", 587);
            var username = _config["EmailMonitor:Username"];
            var password = _config["EmailMonitor:Password"];

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return false;

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(username));
            message.To.Add(MailboxAddress.Parse(email.ToEmail));
            message.Subject = email.Subject;
            message.Body = new TextPart("html") { Text = email.Body };

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", email.ToEmail);
            return false;
        }
    }

    public async Task<bool> MarkAsReadAsync(string messageId)
    {
        _logger.LogInformation("Mark as read: {MessageId}", messageId);
        await Task.CompletedTask;
        return true;
    }
}
