using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using System.Collections.Specialized;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagingController : ControllerBase
{
    private readonly SmsIntegrationService _smsService;
    private readonly WhatsAppIntegrationService _whatsAppService;
    private readonly SignalCommandCenterService _signalService;
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<MessagingController> _logger;
    private readonly IConfiguration _configuration;

    public MessagingController(
        SmsIntegrationService smsService,
        WhatsAppIntegrationService whatsAppService,
        SignalCommandCenterService signalService,
        MemoLibDbContext dbContext,
        ILogger<MessagingController> logger,
        IConfiguration configuration)
    {
        _smsService = smsService;
        _whatsAppService = whatsAppService;
        _signalService = signalService;
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Boîte de réception SMS (événements ingérés)
    /// </summary>
    [HttpGet("sms/inbox")]
    public async Task<IActionResult> GetSmsInbox([FromQuery] int limit = 50)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(new { message = "Non authentifié" });
        }

        var safeLimit = Math.Clamp(limit, 1, 200);

        var events = await _dbContext.Events
            .AsNoTracking()
            .Join(
                _dbContext.Sources.AsNoTracking(),
                eventEntity => eventEntity.SourceId,
                source => source.Id,
                (eventEntity, source) => new { Event = eventEntity, Source = source })
            .Where(x => x.Source.UserId == userId && x.Source.Type == "sms")
            .OrderByDescending(x => x.Event.OccurredAt)
            .Take(safeLimit)
            .ToListAsync();

        var inboxItems = events.Select(x =>
        {
            var payload = ParseSmsPayload(x.Event.RawPayload);
            return new SmsInboxItem(
                x.Event.Id,
                x.Event.ExternalId,
                payload.From,
                payload.To,
                payload.Body,
                x.Event.OccurredAt,
                x.Event.IngestedAt);
        });

        return Ok(inboxItems);
    }

    /// <summary>
    /// Dernier SMS ingéré (accès rapide)
    /// </summary>
    [HttpGet("sms/inbox/latest")]
    public async Task<IActionResult> GetLatestSmsInboxItem()
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return Unauthorized(new { message = "Non authentifié" });
        }

        var latest = await _dbContext.Events
            .AsNoTracking()
            .Join(
                _dbContext.Sources.AsNoTracking(),
                eventEntity => eventEntity.SourceId,
                source => source.Id,
                (eventEntity, source) => new { Event = eventEntity, Source = source })
            .Where(x => x.Source.UserId == userId && x.Source.Type == "sms")
            .OrderByDescending(x => x.Event.OccurredAt)
            .Select(x => new
            {
                x.Event.Id,
                x.Event.ExternalId,
                x.Event.RawPayload,
                x.Event.OccurredAt,
                x.Event.IngestedAt
            })
            .FirstOrDefaultAsync();

        if (latest == null)
        {
            return NotFound(new { message = "Aucun SMS ingéré" });
        }

        var payload = ParseSmsPayload(latest.RawPayload);
        var item = new SmsInboxItem(
            latest.Id,
            latest.ExternalId,
            payload.From,
            payload.To,
            payload.Body,
            latest.OccurredAt,
            latest.IngestedAt);

        return Ok(item);
    }

    /// <summary>
    /// Ingestion SMS transféré depuis un téléphone personnel (option passerelle)
    /// </summary>
    [HttpPost("sms/forwarded")]
    public async Task<IActionResult> ReceiveForwardedSms([FromBody] ForwardedSmsRequest request)
    {
        try
        {
            if (!ValidateForwardingKey(Request.Headers["X-MemoLib-Forward-Key"].FirstOrDefault()))
            {
                _logger.LogWarning("Tentative d'ingestion SMS transféré sans clé valide");
                return Unauthorized(new { message = "Clé d'ingestion invalide" });
            }

            if (string.IsNullOrWhiteSpace(request.From) || string.IsNullOrWhiteSpace(request.To) || string.IsNullOrWhiteSpace(request.Body))
            {
                return BadRequest(new { message = "from, to et body sont obligatoires" });
            }

            var userId = request.UserId ?? GetUserIdFromPhoneNumber(request.To);
            if (userId == Guid.Empty)
            {
                return BadRequest(new { message = "Impossible de déterminer l'utilisateur cible" });
            }

            var messageSid = string.IsNullOrWhiteSpace(request.MessageSid)
                ? $"MANUAL-{Guid.NewGuid():N}"
                : request.MessageSid;

            var result = await _smsService.IngestSmsAsync(
                request.From,
                request.To,
                request.Body,
                messageSid,
                userId);

            if (result.Success)
            {
                await _signalService.ForwardInboundToConfiguredRecipientAsync("sms", request.From, request.Body);
                return Ok(new { message = "SMS transféré ingéré", eventId = result.EventId });
            }

            return BadRequest(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion SMS transféré");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// Webhook pour recevoir les SMS de Twilio
    /// </summary>
    [HttpPost("sms/webhook")]
    public async Task<IActionResult> ReceiveSms([FromForm] TwilioSmsWebhook webhook)
    {
        try
        {
            // Validation signature Twilio pour sécurité
            if (!ValidateTwilioSignature(Request))
            {
                _logger.LogWarning("Signature Twilio invalide");
                return Unauthorized(new { message = "Signature invalide" });
            }

            _logger.LogInformation("SMS reçu de {From}: {Body}", webhook.From, webhook.Body);

            var userId = GetUserIdFromPhoneNumber(webhook.To);

            var result = await _smsService.IngestSmsAsync(
                webhook.From,
                webhook.To,
                webhook.Body ?? string.Empty,
                webhook.MessageSid,
                userId);

            if (result.Success)
            {
                await _signalService.ForwardInboundToConfiguredRecipientAsync("sms", webhook.From, webhook.Body ?? string.Empty);
                // Réponse TwiML pour Twilio
                return Content("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", "text/xml");
            }

            return BadRequest(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur webhook SMS");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// Webhook Vonage inbound SMS (GET)
    /// </summary>
    [HttpGet("sms/vonage/webhook")]
    public async Task<IActionResult> ReceiveVonageSmsGet()
    {
        return await HandleVonageInboundAsync();
    }

    /// <summary>
    /// Webhook Vonage inbound SMS (POST)
    /// </summary>
    [HttpPost("sms/vonage/webhook")]
    public async Task<IActionResult> ReceiveVonageSmsPost()
    {
        return await HandleVonageInboundAsync();
    }

    /// <summary>
    /// Webhook pour recevoir les messages WhatsApp de Twilio
    /// </summary>
    [HttpPost("whatsapp/webhook")]
    public async Task<IActionResult> ReceiveWhatsApp([FromForm] TwilioWhatsAppWebhook webhook)
    {
        try
        {
            // Validation signature Twilio pour sécurité
            if (!ValidateTwilioSignature(Request))
            {
                _logger.LogWarning("Signature Twilio invalide");
                return Unauthorized(new { message = "Signature invalide" });
            }

            _logger.LogInformation("WhatsApp reçu de {From}: {Body}", webhook.From, webhook.Body);

            var userId = GetUserIdFromPhoneNumber(webhook.To);

            var result = await _whatsAppService.IngestWhatsAppMessageAsync(
                webhook.From,
                webhook.To,
                webhook.Body ?? string.Empty,
                webhook.MessageSid,
                userId,
                webhook.MediaUrl0);

            if (result.Success)
            {
                await _signalService.ForwardInboundToConfiguredRecipientAsync("whatsapp", webhook.From, webhook.Body ?? string.Empty);
                // Réponse TwiML pour Twilio
                return Content("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", "text/xml");
            }

            return BadRequest(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur webhook WhatsApp");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// Envoyer un SMS
    /// </summary>
    [HttpPost("sms/send")]
    public async Task<IActionResult> SendSms([FromBody] SendSmsRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Non authentifié" });

        var success = await _smsService.SendSmsAsync(request.To, request.Body, userId);

        if (success)
            return Ok(new { message = "SMS envoyé" });

        return BadRequest(new { message = "Échec envoi SMS" });
    }

    /// <summary>
    /// Envoyer un message WhatsApp
    /// </summary>
    [HttpPost("whatsapp/send")]
    public async Task<IActionResult> SendWhatsApp([FromBody] SendWhatsAppRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Non authentifié" });

        var success = await _whatsAppService.SendWhatsAppMessageAsync(request.To, request.Body, userId);

        if (success)
            return Ok(new { message = "WhatsApp envoyé" });

        return BadRequest(new { message = "Échec envoi WhatsApp" });
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private Guid GetUserIdFromPhoneNumber(string phoneNumber)
    {
        // TODO: Implémenter mapping numéro → userId
        // Pour la démo, retourner un GUID fixe
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    private bool ValidateTwilioSignature(HttpRequest request)
    {
        try
        {
            var authToken = _configuration["Twilio:AuthToken"];
            if (string.IsNullOrEmpty(authToken))
                return true; // Mode dev sans validation

            var signature = request.Headers["X-Twilio-Signature"].FirstOrDefault();
            if (string.IsNullOrEmpty(signature))
                return false;

            var validator = new Twilio.Security.RequestValidator(authToken);
            var parameters = new NameValueCollection();

            if (request.HasFormContentType)
            {
                foreach (var entry in request.Form)
                {
                    foreach (var value in entry.Value)
                    {
                        parameters.Add(entry.Key, value);
                    }
                }
            }

            var url = $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}";
            if (validator.Validate(url, parameters, signature))
            {
                return true;
            }

            var forwardedProto = request.Headers["X-Forwarded-Proto"].FirstOrDefault();
            var forwardedHost = request.Headers["X-Forwarded-Host"].FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(forwardedProto) && !string.IsNullOrWhiteSpace(forwardedHost))
            {
                var forwardedUrl = $"{forwardedProto}://{forwardedHost}{request.Path}{request.QueryString}";
                if (validator.Validate(forwardedUrl, parameters, signature))
                {
                    return true;
                }
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    private bool ValidateForwardingKey(string? providedKey)
    {
        var configuredKey = _configuration["Messaging:ForwardingApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey) || string.IsNullOrWhiteSpace(providedKey))
        {
            return false;
        }

        var configuredBytes = Encoding.UTF8.GetBytes(configuredKey);
        var providedBytes = Encoding.UTF8.GetBytes(providedKey);

        return CryptographicOperations.FixedTimeEquals(configuredBytes, providedBytes);
    }

    private async Task<IActionResult> HandleVonageInboundAsync()
    {
        try
        {
            var webhookKey = GetRequestValue("key");
            if (!ValidateVonageInboundKey(webhookKey))
            {
                _logger.LogWarning("Tentative webhook Vonage sans clé valide");
                return Unauthorized(new { message = "Clé webhook Vonage invalide" });
            }

            var from = GetRequestValue("msisdn") ?? GetRequestValue("from");
            var to = GetRequestValue("to");
            var body = GetRequestValue("text") ?? GetRequestValue("body");
            var messageId = GetRequestValue("messageId") ?? GetRequestValue("message-id") ?? $"VONAGE-{Guid.NewGuid():N}";

            if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to) || string.IsNullOrWhiteSpace(body))
            {
                return BadRequest(new { message = "msisdn/from, to et text/body sont obligatoires" });
            }

            var userId = GetUserIdFromPhoneNumber(to);
            if (userId == Guid.Empty)
            {
                return BadRequest(new { message = "Impossible de déterminer l'utilisateur cible" });
            }

            var result = await _smsService.IngestSmsAsync(
                from,
                to,
                body,
                messageId,
                userId);

            if (result.Success)
            {
                await _signalService.ForwardInboundToConfiguredRecipientAsync("sms", from, body);
                return Ok(new { message = "SMS Vonage ingéré", eventId = result.EventId });
            }

            return BadRequest(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur webhook Vonage SMS");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    private string? GetRequestValue(string key)
    {
        var queryValue = Request.Query[key].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(queryValue))
        {
            return queryValue;
        }

        if (Request.HasFormContentType)
        {
            var formValue = Request.Form[key].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(formValue))
            {
                return formValue;
            }
        }

        return null;
    }

    private bool ValidateVonageInboundKey(string? providedKey)
    {
        var configuredKey = _configuration["Vonage:InboundWebhookKey"];
        if (string.IsNullOrWhiteSpace(configuredKey) || string.IsNullOrWhiteSpace(providedKey))
        {
            return false;
        }

        var configuredBytes = Encoding.UTF8.GetBytes(configuredKey);
        var providedBytes = Encoding.UTF8.GetBytes(providedKey);
        return CryptographicOperations.FixedTimeEquals(configuredBytes, providedBytes);
    }

    private static (string? From, string? To, string? Body) ParseSmsPayload(string rawPayload)
    {
        if (string.IsNullOrWhiteSpace(rawPayload))
        {
            return (null, null, null);
        }

        try
        {
            using var document = JsonDocument.Parse(rawPayload);
            var root = document.RootElement;

            string? from = root.TryGetProperty("from", out var fromProp) ? fromProp.GetString() : null;
            string? to = root.TryGetProperty("to", out var toProp) ? toProp.GetString() : null;
            string? body = root.TryGetProperty("body", out var bodyProp) ? bodyProp.GetString() : null;

            return (from, to, body);
        }
        catch
        {
            return (null, null, null);
        }
    }
}

public class TwilioSmsWebhook
{
    public string MessageSid { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string? Body { get; set; }
}

public class TwilioWhatsAppWebhook
{
    public string MessageSid { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? MediaUrl0 { get; set; }
}

public record SendSmsRequest(string To, string Body);
public record SendWhatsAppRequest(string To, string Body);
public record ForwardedSmsRequest(string From, string To, string Body, string? MessageSid, Guid? UserId);
public record SmsInboxItem(Guid EventId, string ExternalId, string? From, string? To, string? Body, DateTime OccurredAt, DateTime IngestedAt);
