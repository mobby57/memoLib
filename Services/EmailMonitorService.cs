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
        var connectTimeout = _configuration.GetValue<int>("EmailMonitor:ConnectTimeoutSeconds", 10);
        var maxRetries = _configuration.GetValue<int>("EmailMonitor:MaxRetries", 3);

        _logger.LogInformation($"Email monitor démarré: {username}@{host}:{port}");

        while (!stoppingToken.IsCancellationRequested)
        {
            var retryCount = 0;
            var success = false;

            while (retryCount < maxRetries && !success && !stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(password))
                    {
                        _logger.LogWarning("EmailMonitor: Mot de passe IMAP manquant. Configurez-le avec: dotnet user-secrets set \"EmailMonitor:Password\" \"votre-mot-de-passe\"");
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        break;
                    }

                    if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || port <= 0)
                    {
                        _logger.LogWarning("EmailMonitor: Configuration IMAP incomplète (host/port/username).");
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        break;
                    }

                    using var client = new ImapClient();
                    client.Timeout = connectTimeout * 1000;
                    await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.SslOnConnect, stoppingToken);
                    await client.AuthenticateAsync(username, password, stoppingToken);

                    var inbox = client.Inbox;
                    await inbox.OpenAsync(FolderAccess.ReadWrite, stoppingToken);

                    var query = SearchQuery.And(SearchQuery.NotSeen, SearchQuery.DeliveredAfter(DateTime.UtcNow.AddDays(-7)));
                    var uids = await inbox.SearchAsync(query, stoppingToken);

                    var messagesToProcess = new List<MimeMessage>();
                    foreach (var uid in uids.Take(batchSize))
                    {
                        lock (client.SyncRoot)
                        {
                            var message = inbox.GetMessage(uid, stoppingToken);
                            messagesToProcess.Add(message);
                            inbox.AddFlags(uid, MessageFlags.Seen, true, stoppingToken);
                        }
                    }

                    await client.DisconnectAsync(true, stoppingToken);
                    success = true;

                    // Traiter les messages APRÈS déconnexion IMAP
                    foreach (var message in messagesToProcess)
                    {
                        await ProcessEmailAsync(message, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    retryCount++;
                    _logger.LogError(ex, $"Erreur monitoring email (tentative {retryCount}/{maxRetries})");

                    if (retryCount < maxRetries)
                    {
                        var delay = TimeSpan.FromSeconds(Math.Pow(2, retryCount));
                        _logger.LogInformation($"Retry dans {delay.TotalSeconds}s...");
                        await Task.Delay(delay, stoppingToken);
                    }
                }
            }

            if (!success)
            {
                _logger.LogWarning("EmailMonitor: Échec après {MaxRetries} tentatives, pause 5min", maxRetries);
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            else
            {
                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
            }
        }
    }

    private async Task ProcessEmailAsync(MimeMessage message, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();
        var organizer = scope.ServiceProvider.GetRequiredService<IntelligentWorkspaceOrganizerService>();
        var signalService = scope.ServiceProvider.GetRequiredService<SignalCommandCenterService>();
        var classifier = scope.ServiceProvider.GetRequiredService<EmailClassificationService>();

        var from = message.From.Mailboxes.FirstOrDefault()?.Address ?? "unknown@unknown.com";
        var subject = message.Subject ?? "";
        var body = message.TextBody ?? message.HtmlBody ?? "";
        var externalId = message.MessageId ?? $"EMAIL-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        // R2: Vérification SPF/DKIM via headers Authentication-Results
        var authResult = message.Headers["Authentication-Results"] ?? "";
        var spfFail = authResult.Contains("spf=fail", StringComparison.OrdinalIgnoreCase)
                   || authResult.Contains("spf=softfail", StringComparison.OrdinalIgnoreCase);
        var dkimFail = authResult.Contains("dkim=fail", StringComparison.OrdinalIgnoreCase);

        if (spfFail || dkimFail)
        {
            _logger.LogWarning("⚠️ Email suspect (SPF/DKIM fail): {From} | SPF={SpfFail} DKIM={DkimFail}", from, spfFail, dkimFail);
            var rejectSpoofed = _configuration.GetValue<bool>("EmailMonitor:RejectSpoofedEmails");
            if (rejectSpoofed)
            {
                _logger.LogWarning("🚫 Email rejeté (spoofing détecté): {From}", from);
                return;
            }
        }

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

        // Classification automatique de l'email
        try
        {
            var classification = await classifier.ClassifyAsync(from, subject, body);
            evt.TextForEmbedding = $"[{classification.Category}] {subject} - {body}";
            _logger.LogInformation("📊 Email classifié: {Category} (urgence: {Urgency}, priorité: {Priority})",
                classification.Category, classification.Urgency, classification.SuggestedPriority);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Classification email échouée, fallback sans classification");
            evt.TextForEmbedding = $"{subject} - {body}";
        }

        context.Events.Add(evt);

        // Organisation intelligente des workspaces
        var workspaceId = await organizer.GetOrCreateWorkspaceAsync(user.Id, from, subject, body);
        context.CaseEvents.Add(new CaseEvent { CaseId = workspaceId, EventId = evt.Id });

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

        await signalService.ForwardInboundToConfiguredRecipientAsync(
            "email",
            from,
            BuildSignalRelayEmailText(subject, body));

        _logger.LogInformation($"✅ Email organisé intelligemment: {from} → Workspace {workspaceId}");
    }

    private static string BuildSignalRelayEmailText(string subject, string body)
    {
        var safeSubject = string.IsNullOrWhiteSpace(subject) ? "(sans objet)" : subject.Trim();
        var safeBody = string.IsNullOrWhiteSpace(body) ? "(contenu vide)" : body.Trim();

        if (safeBody.Length > 1200)
        {
            safeBody = safeBody[..1200] + "...";
        }

        return $"Objet: {safeSubject}\n\n{safeBody}";
    }

    private static string ComputeSHA256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? ""));
        return Convert.ToHexString(bytes);
    }
}
