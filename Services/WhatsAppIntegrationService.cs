using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

namespace MemoLib.Api.Services;

public class WhatsAppIntegrationService
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<WhatsAppIntegrationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public WhatsAppIntegrationService(
        MemoLibDbContext dbContext,
        ILogger<WhatsAppIntegrationService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<(bool Success, string Message, Guid? EventId)> IngestWhatsAppMessageAsync(
        string from,
        string to,
        string body,
        string messageId,
        Guid userId,
        string? mediaUrl = null)
    {
        try
        {
            var source = await GetOrCreateSourceAsync(userId, "whatsapp");

            // Vérifier doublon
            var existing = await _dbContext.Events
                .FirstOrDefaultAsync(e => e.ExternalId == messageId && e.SourceId == source.Id);

            if (existing != null)
            {
                return (false, "Message WhatsApp déjà ingéré", existing.Id);
            }

            // Extraire le numéro de téléphone (WhatsApp format: whatsapp:+33...)
            var phoneNumber = from.Replace("whatsapp:", "").Trim();
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);

            // Trouver ou créer le client
            var client = await _dbContext.Clients
                .FirstOrDefaultAsync(c => c.PhoneNumber == normalizedPhone && c.UserId == userId);

            if (client == null)
            {
                client = new Client
                {
                    Id = Guid.NewGuid(),
                    Name = $"Client WhatsApp {normalizedPhone}",
                    Email = $"whatsapp.{normalizedPhone.Replace("+", "")}@memolib.local",
                    PhoneNumber = normalizedPhone,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Clients.Add(client);
            }

            // Trouver ou créer le dossier
            var caseTitle = $"WhatsApp - {client.Name}";
            var existingCase = await _dbContext.Cases
                .FirstOrDefaultAsync(c => c.Title == caseTitle && c.UserId == userId);

            Case caseEntity;
            if (existingCase == null)
            {
                caseEntity = new Case
                {
                    Id = Guid.NewGuid(),
                    Title = caseTitle,
                    ClientId = client.Id,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Cases.Add(caseEntity);
            }
            else
            {
                caseEntity = existingCase;
            }

            // Créer l'événement
            var payload = JsonSerializer.Serialize(new
            {
                from,
                to,
                body,
                mediaUrl,
                type = "whatsapp",
                messageId
            });

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                SourceId = source.Id,
                ExternalId = messageId,
                Checksum = ComputeChecksum(payload),
                OccurredAt = DateTime.UtcNow,
                IngestedAt = DateTime.UtcNow,
                RawPayload = payload,
                EventType = "WHATSAPP",
                Severity = 2,
                TextForEmbedding = body,
                ValidationFlags = string.IsNullOrWhiteSpace(from) ? "MISSING_SENDER" : null,
                RequiresAttention = string.IsNullOrWhiteSpace(from)
            };

            _dbContext.Events.Add(eventEntity);

            // Lier l'événement au dossier
            _dbContext.CaseEvents.Add(new CaseEvent
            {
                CaseId = caseEntity.Id,
                EventId = eventEntity.Id
            });

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Message WhatsApp ingéré: {MessageId} de {From}", messageId, from);

            return (true, "Message WhatsApp ingéré avec succès", eventEntity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion WhatsApp");
            return (false, ex.Message, null);
        }
    }

    public async Task<bool> SendWhatsAppMessageAsync(string to, string body, Guid userId)
    {
        try
        {
            var accountSid = _configuration["Twilio:AccountSid"];
            var fromNumber = _configuration["Twilio:WhatsAppNumber"];

            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(fromNumber))
            {
                _logger.LogWarning("Configuration Twilio WhatsApp manquante");
                return false;
            }

            var authHeader = BuildTwilioAuthorizationHeader();
            if (authHeader == null)
            {
                _logger.LogWarning("Credentials Twilio manquants (Twilio:ApiKeySid/Twilio:ApiKeySecret ou Twilio:AuthToken)");
                return false;
            }

            // Format WhatsApp
            var whatsappTo = to.StartsWith("whatsapp:") ? to : $"whatsapp:{to}";
            var whatsappFrom = fromNumber.StartsWith("whatsapp:") ? fromNumber : $"whatsapp:{fromNumber}";

            var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
            
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("To", whatsappTo),
                new KeyValuePair<string, string>("From", whatsappFrom),
                new KeyValuePair<string, string>("Body", body)
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = content
            };
            request.Headers.Authorization = authHeader;

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Message WhatsApp envoyé à {To}", to);
                return true;
            }

            _logger.LogWarning("Échec envoi WhatsApp: {Status}", response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi WhatsApp");
            return false;
        }
    }

    private AuthenticationHeaderValue? BuildTwilioAuthorizationHeader()
    {
        var apiKeySid = _configuration["Twilio:ApiKeySid"];
        var apiKeySecret = _configuration["Twilio:ApiKeySecret"];

        if (!string.IsNullOrWhiteSpace(apiKeySid) && !string.IsNullOrWhiteSpace(apiKeySecret))
        {
            var apiKeyAuthValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{apiKeySid}:{apiKeySecret}"));
            return new AuthenticationHeaderValue("Basic", apiKeyAuthValue);
        }

        if (!string.IsNullOrWhiteSpace(apiKeySid) || !string.IsNullOrWhiteSpace(apiKeySecret))
        {
            _logger.LogWarning("Configuration Twilio API Key incomplète: renseigner Twilio:ApiKeySid et Twilio:ApiKeySecret");
        }

        var accountSid = _configuration["Twilio:AccountSid"];
        var authToken = _configuration["Twilio:AuthToken"];
        if (string.IsNullOrWhiteSpace(accountSid) || string.IsNullOrWhiteSpace(authToken))
        {
            return null;
        }

        var fallbackAuthValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));
        return new AuthenticationHeaderValue("Basic", fallbackAuthValue);
    }

    private async Task<Source> GetOrCreateSourceAsync(Guid userId, string sourceType)
    {
        var source = await _dbContext.Sources
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Type == sourceType);

        if (source != null)
        {
            return source;
        }

        source = new Source
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = sourceType
        };

        _dbContext.Sources.Add(source);
        await _dbContext.SaveChangesAsync();

        return source;
    }

    private static string ComputeChecksum(string payload)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload ?? string.Empty));
        return Convert.ToHexString(bytes);
    }

    private string NormalizePhoneNumber(string phone)
    {
        if (string.IsNullOrEmpty(phone)) return phone;
        
        var normalized = phone.Trim().Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        if (!normalized.StartsWith("+"))
        {
            if (normalized.StartsWith("0"))
                normalized = "+33" + normalized.Substring(1);
            else if (!normalized.StartsWith("33"))
                normalized = "+33" + normalized;
            else
                normalized = "+" + normalized;
        }
        
        return normalized;
    }
}
