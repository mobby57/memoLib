using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MimeKit;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/email-scan")]
public class EmailScanController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailScanController> _logger;
    private readonly ClientInfoExtractor _extractor;

    public EmailScanController(MemoLibDbContext context, IConfiguration configuration, ILogger<EmailScanController> logger, ClientInfoExtractor extractor)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _extractor = extractor;
    }

    [HttpPost("manual")]
    public async Task<IActionResult> ManualScan([FromQuery] bool unreadOnly = false, [FromQuery] int daysBack = 0)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var enabled = _configuration.GetValue<bool>("EmailMonitor:Enabled");
        if (!enabled)
            return BadRequest(new { message = "Email monitor désactivé" });

        var host = _configuration["EmailMonitor:ImapHost"];
        var port = _configuration.GetValue<int>("EmailMonitor:ImapPort");
        var username = _configuration["EmailMonitor:Username"];
        var password = _configuration["EmailMonitor:Password"];

        if (string.IsNullOrWhiteSpace(host) || port <= 0)
            return BadRequest(new { message = "Configuration IMAP incomplète (hôte/port)." });

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            return BadRequest(new { message = "Configuration IMAP incomplète (email/mot de passe)." });

        if (username.Contains("votre.email", StringComparison.OrdinalIgnoreCase)
            || password.Contains("votre_mot_de_passe", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Configuration IMAP non renseignée. Remplacez les valeurs d'exemple dans appsettings.json." });

        try
        {
            using var client = new ImapClient();
            await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.SslOnConnect);
            await client.AuthenticateAsync(username, password);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadWrite);

            var query = SearchQuery.All;

            if (unreadOnly)
            {
                query = SearchQuery.NotSeen;
            }

            if (daysBack > 0)
            {
                var deliveredAfter = SearchQuery.DeliveredAfter(DateTime.UtcNow.AddDays(-daysBack));
                query = SearchQuery.And(query, deliveredAfter);
            }

            var uids = await inbox.SearchAsync(query);
            _logger.LogInformation($"Scan manuel: {uids.Count} emails trouvés");

            var previewLimit = 50;
            var lineDetails = new List<object>();
            var withPhone = 0;
            var withAddress = 0;
            var withAttachments = 0;
            var clientsCreated = 0;
            var requiresAttentionCount = 0;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            var source = await _context.Sources.FirstOrDefaultAsync(s => s.UserId == user.Id);
            if (source == null)
            {
                source = new Source
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Type = "EMAIL"
                };
                _context.Sources.Add(source);
                await _context.SaveChangesAsync();
            }

            int ingested = 0, duplicates = 0;

            foreach (var uid in uids)
            {
                var message = await inbox.GetMessageAsync(uid);
                var from = message.From.Mailboxes.FirstOrDefault()?.Address ?? "unknown@unknown.com";
                var subject = message.Subject ?? "";
                var bodyText = message.TextBody ?? "";
                var bodyHtml = message.HtmlBody ?? "";
                var body = !string.IsNullOrWhiteSpace(bodyText) ? bodyText : bodyHtml;
                var externalId = message.MessageId ?? $"EMAIL-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
                var toRecipients = string.Join(", ", message.To.Mailboxes.Select(m => m.Address));
                var ccRecipients = string.Join(", ", message.Cc.Mailboxes.Select(m => m.Address));
                var bccRecipients = string.Join(", ", message.Bcc.Mailboxes.Select(m => m.Address));
                var replyToRecipients = string.Join(", ", message.ReplyTo.Mailboxes.Select(m => m.Address));
                var attachmentNames = message.Attachments
                    .OfType<MimePart>()
                    .Select(a => a.FileName ?? "piece-jointe")
                    .ToList();

                var extractedPhone = _extractor.ExtractPhone(body);
                var extractedAddress = _extractor.ExtractAddress(body);
                var normalizedSenderName = _extractor.NormalizeName(message.From.Mailboxes.FirstOrDefault()?.Name, from);

                if (!string.IsNullOrWhiteSpace(extractedPhone)) withPhone++;
                if (!string.IsNullOrWhiteSpace(extractedAddress)) withAddress++;
                if (attachmentNames.Count > 0) withAttachments++;

                var checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(body)));
                var duplicate = await _context.Events.FirstOrDefaultAsync(e => e.ExternalId == externalId || e.Checksum == checksum);

                if (duplicate != null)
                {
                    duplicates++;

                    if (lineDetails.Count < previewLimit)
                    {
                        lineDetails.Add(new
                        {
                            status = "duplicate",
                            occurredAt = message.Date.UtcDateTime,
                            from,
                            to = toRecipients,
                            cc = ccRecipients,
                            bcc = bccRecipients,
                            replyTo = replyToRecipients,
                            subject,
                            messageId = externalId,
                            checksum,
                            hasAttachments = attachmentNames.Count > 0,
                            attachmentNames,
                            bodyLength = body.Length,
                            extractedPhone,
                            extractedAddress,
                            normalizedSenderName,
                            eventId = duplicate.Id
                        });
                    }

                    continue;
                }

                // Créer ou récupérer le client
                var businessClient = await _context.Clients.FirstOrDefaultAsync(c => c.Email.ToLower() == from.ToLower());
                var clientCreated = false;
                if (businessClient == null && from != "unknown@unknown.com")
                {
                    businessClient = new Client
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Name = normalizedSenderName,
                        Email = from,
                        PhoneNumber = extractedPhone,
                        Address = extractedAddress,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Clients.Add(businessClient);
                    await _context.SaveChangesAsync();
                    clientCreated = true;
                    clientsCreated++;
                }

                var rawPayload = JsonSerializer.Serialize(new
                {
                    from,
                    to = toRecipients,
                    cc = ccRecipients,
                    bcc = bccRecipients,
                    replyTo = replyToRecipients,
                    subject,
                    bodyText,
                    bodyHtml,
                    body,
                    messageId = externalId,
                    occurredAt = message.Date.UtcDateTime,
                    attachments = attachmentNames,
                    extracted = new
                    {
                        senderName = normalizedSenderName,
                        phone = extractedPhone,
                        address = extractedAddress
                    }
                });

                var evt = new Event
                {
                    Id = Guid.NewGuid(),
                    SourceId = source.Id,
                    EventType = "EMAIL",
                    ExternalId = externalId,
                    OccurredAt = message.Date.UtcDateTime,
                    IngestedAt = DateTime.UtcNow,
                    RawPayload = rawPayload,
                    Checksum = checksum,
                    ValidationFlags = string.IsNullOrWhiteSpace(from) ? "MISSING_SENDER" : null,
                    RequiresAttention = string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(subject)
                };

                if (evt.RequiresAttention)
                {
                    requiresAttentionCount++;
                }

                _context.Events.Add(evt);
                await _context.SaveChangesAsync();

                try
                {
                    var caseTitle = !string.IsNullOrWhiteSpace(subject) ? subject : "Email sans sujet";
                    var newCase = new Case
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        ClientId = businessClient?.Id,
                        Title = caseTitle,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Cases.Add(newCase);
                    _context.CaseEvents.Add(new CaseEvent { CaseId = newCase.Id, EventId = evt.Id });
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogWarning(dbEx, "Création dossier ignorée pendant scan manuel (schéma local potentiellement non à jour). EventId={EventId}", evt.Id);
                }

                ingested++;

                if (lineDetails.Count < previewLimit)
                {
                    lineDetails.Add(new
                    {
                        status = "ingested",
                        occurredAt = message.Date.UtcDateTime,
                        from,
                        to = toRecipients,
                        cc = ccRecipients,
                        bcc = bccRecipients,
                        replyTo = replyToRecipients,
                        subject,
                        messageId = externalId,
                        checksum,
                        hasAttachments = attachmentNames.Count > 0,
                        attachmentNames,
                        bodyLength = body.Length,
                        extractedPhone,
                        extractedAddress,
                        normalizedSenderName,
                        clientCreated,
                        eventId = evt.Id,
                        requiresAttention = evt.RequiresAttention
                    });
                }
            }

            await client.DisconnectAsync(true);

            return Ok(new { 
                message = "Scan terminé", 
                unreadOnly,
                daysBack,
                totalEmails = uids.Count,
                ingested, 
                duplicates,
                fieldsCaptured = new[]
                {
                    "from",
                    "to",
                    "cc",
                    "bcc",
                    "replyTo",
                    "subject",
                    "messageId",
                    "occurredAt",
                    "bodyText",
                    "bodyHtml",
                    "attachments",
                    "extracted.senderName",
                    "extracted.phone",
                    "extracted.address",
                    "checksum",
                    "requiresAttention"
                },
                exploitation = new
                {
                    withPhone,
                    withAddress,
                    withAttachments,
                    clientsCreated,
                    requiresAttention = requiresAttentionCount
                },
                linesPreviewCount = lineDetails.Count,
                linesPreview = lineDetails
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur scan manuel");

            var msg = ex.Message ?? string.Empty;
            var normalized = msg.ToLowerInvariant();
            var inner = ex.InnerException?.Message ?? string.Empty;
            var combined = $"{normalized} {inner.ToLowerInvariant()}";

            if (normalized.Contains("invalid credentials")
                || normalized.Contains("authentication failed")
                || normalized.Contains("authentification"))
            {
                return Unauthorized(new
                {
                    message = "Échec d'authentification IMAP. Vérifiez l'email de connexion et le mot de passe d'application de votre boîte mail.",
                    hint = "Pour Gmail, activez la validation en 2 étapes puis utilisez un mot de passe d'application."
                });
            }

            if (combined.Contains("ssl")
                || combined.Contains("tls")
                || combined.Contains("handshake")
                || combined.Contains("certificate"))
            {
                return StatusCode(503, new
                {
                    message = "Connexion IMAP sécurisée impossible (SSL/TLS).",
                    hint = "Vérifiez le serveur/port IMAP et la sécurité (Gmail: imap.gmail.com:993 SSL).",
                    details = msg
                });
            }

            if (combined.Contains("timeout")
                || combined.Contains("timed out")
                || combined.Contains("unreachable")
                || combined.Contains("socket"))
            {
                return StatusCode(503, new
                {
                    message = "Le serveur IMAP ne répond pas pour le moment.",
                    hint = "Vérifiez votre connexion réseau et les paramètres hôte/port IMAP.",
                    details = msg
                });
            }

            return StatusCode(500, new { message = "Erreur technique pendant le scan manuel.", details = ex.Message });
        }
    }
}
