using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace MemoLib.Api.Services;

public class EmailMonitorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EmailMonitorService> _logger;
    private readonly IConfiguration _configuration;

    public EmailMonitorService(IServiceProvider serviceProvider, ILogger<EmailMonitorService> logger, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var enabled = _configuration.GetValue<bool>("EmailMonitor:Enabled");
        if (!enabled)
        {
            _logger.LogInformation("Email monitor désactivé");
            return;
        }

        var host = _configuration["EmailMonitor:ImapHost"];
        var port = _configuration.GetValue<int>("EmailMonitor:ImapPort");
        var username = _configuration["EmailMonitor:Username"];
        var password = _configuration["EmailMonitor:Password"];
        var intervalSeconds = _configuration.GetValue<int>("EmailMonitor:IntervalSeconds", 60);
        var batchSize = _configuration.GetValue<int>("EmailMonitor:BatchSize", 50);

        _logger.LogInformation($"Email monitor démarré: {username}@{host}:{port}");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || port <= 0)
                {
                    _logger.LogWarning("EmailMonitor activé mais configuration IMAP incomplète (host/port/username/password). Nouveau test au prochain cycle.");
                    await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
                    continue;
                }

                using var client = new ImapClient();
                await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.SslOnConnect, stoppingToken);
                await client.AuthenticateAsync(username, password, stoppingToken);

                var inbox = client.Inbox;
                await inbox.OpenAsync(FolderAccess.ReadWrite, stoppingToken);

                // Optimisation: traiter seulement les emails récents non lus
                var query = SearchQuery.And(SearchQuery.NotSeen, SearchQuery.DeliveredAfter(DateTime.UtcNow.AddDays(-7)));
                var uids = await inbox.SearchAsync(query, stoppingToken);

                // Traitement par batch pour éviter la surcharge
                var batches = uids.Take(batchSize).Chunk(10);
                foreach (var batch in batches)
                {
                    var tasks = batch.Select(async uid =>
                    {
                        var message = await inbox.GetMessageAsync(uid, stoppingToken);
                        await ProcessEmailAsync(message, stoppingToken);
                        await inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, stoppingToken);
                    });
                    await Task.WhenAll(tasks);
                }

                await client.DisconnectAsync(true, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur monitoring email");
            }

            await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
        }
    }

    private async Task ProcessEmailAsync(MimeMessage message, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();

        var from = message.From.Mailboxes.FirstOrDefault()?.Address ?? "unknown@unknown.com";
        var subject = message.Subject ?? "";
        var body = message.TextBody ?? message.HtmlBody ?? "";
        var externalId = message.MessageId ?? $"EMAIL-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        // CONTRÔLE: Ignorer certains expéditeurs
        var blacklist = _configuration.GetSection("EmailMonitor:Blacklist").Get<string[]>() ?? Array.Empty<string>();
        if (blacklist.Any(b => from.Contains(b, StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogInformation($"Email ignoré (blacklist): {from}");
            return;
        }

        // CONTRÔLE: Traiter uniquement certains expéditeurs
        var whitelist = _configuration.GetSection("EmailMonitor:Whitelist").Get<string[]>();
        if (whitelist != null && whitelist.Length > 0 && !whitelist.Any(w => from.Contains(w, StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogInformation($"Email ignoré (pas dans whitelist): {from}");
            return;
        }

        var checksum = ComputeSHA256(body);
        var duplicate = await context.Events.FirstOrDefaultAsync(e => 
            e.ExternalId == externalId || e.Checksum == checksum, cancellationToken);

        if (duplicate != null)
        {
            _logger.LogWarning($"Email doublon ignoré: {externalId}");
            return;
        }

        var user = await context.Users.FirstOrDefaultAsync(cancellationToken);
        if (user == null)
        {
            _logger.LogError("Aucun utilisateur trouvé pour ingestion auto");
            return;
        }

        var source = await context.Sources.FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);
        if (source == null)
        {
            source = new Source
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Type = "email"
            };
            context.Sources.Add(source);
            await context.SaveChangesAsync(cancellationToken);
        }

        var evt = new Event
        {
            Id = Guid.NewGuid(),
            SourceId = source.Id,
            EventType = "EMAIL",
            ExternalId = externalId,
            OccurredAt = message.Date.UtcDateTime,
            IngestedAt = DateTime.UtcNow,
            RawPayload = $"{{\"from\":\"{from}\",\"subject\":\"{subject}\",\"body\":\"{body}\"}}",
            Checksum = checksum,
            ValidationFlags = string.IsNullOrWhiteSpace(from) ? "MISSING_SENDER" : null,
            RequiresAttention = string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(subject)
        };

        context.Events.Add(evt);

        var caseTitle = !string.IsNullOrWhiteSpace(subject) ? subject : "Email sans sujet";
        var newCase = new Case
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = caseTitle,
            CreatedAt = DateTime.UtcNow
        };
        context.Cases.Add(newCase);

        context.CaseEvents.Add(new CaseEvent { CaseId = newCase.Id, EventId = evt.Id });

        // Extraire et sauvegarder les pièces jointes
        if (message.Attachments.Any())
        {
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            Directory.CreateDirectory(uploadPath);

            foreach (var attachment in message.Attachments.OfType<MimePart>())
            {
                if (attachment.FileName == null) continue;

                var fileName = $"{Guid.NewGuid()}_{attachment.FileName}";
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = File.Create(filePath))
                {
                    attachment.Content?.DecodeTo(stream);
                }

                var attachmentRecord = new Attachment
                {
                    Id = Guid.NewGuid(),
                    EventId = evt.Id,
                    FileName = attachment.FileName,
                    ContentType = attachment.ContentType.MimeType,
                    FileSize = new FileInfo(filePath).Length,
                    FilePath = filePath,
                    UploadedAt = DateTime.UtcNow
                };

                context.Attachments.Add(attachmentRecord);
                _logger.LogInformation($"📎 Pièce jointe sauvegardée: {attachment.FileName}");
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation($"✅ Email ingéré: {from} - {subject}");
    }

    private static string ComputeSHA256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? ""));
        return Convert.ToHexString(bytes);
    }
}
