using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

namespace MemoLib.Api.Services;

public class SmsIntegrationService
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<SmsIntegrationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public SmsIntegrationService(
        MemoLibDbContext dbContext,
        ILogger<SmsIntegrationService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<(bool Success, string Message, Guid? EventId)> IngestSmsAsync(
        string from,
        string to,
        string body,
        string smsId,
        Guid userId)
    {
        try
        {
            var source = await GetOrCreateSourceAsync(userId, "sms");

            // Vérifier doublon
            var existing = await _dbContext.Events
                .FirstOrDefaultAsync(e => e.ExternalId == smsId && e.SourceId == source.Id);

            if (existing != null)
            {
                return (false, "SMS déjà ingéré", existing.Id);
            }

            // Trouver ou créer le client
            var normalizedPhone = NormalizePhoneNumber(from);
            var client = await _dbContext.Clients
                .FirstOrDefaultAsync(c => c.PhoneNumber == normalizedPhone && c.UserId == userId);

            if (client == null)
            {
                client = new Client
                {
                    Id = Guid.NewGuid(),
                    Name = $"Client SMS {from}",
                    Email = $"sms.{normalizedPhone.Replace("+", "")}@memolib.local",
                    PhoneNumber = normalizedPhone,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Clients.Add(client);
            }

            // Trouver ou créer le dossier
            var caseTitle = $"SMS - {client.Name}";
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
                type = "sms",
                smsId
            });

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                SourceId = source.Id,
                ExternalId = smsId,
                Checksum = ComputeChecksum(payload),
                OccurredAt = DateTime.UtcNow,
                IngestedAt = DateTime.UtcNow,
                RawPayload = payload,
                EventType = "SMS",
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

            _logger.LogInformation("SMS ingéré: {SmsId} de {From}", smsId, from);

            return (true, "SMS ingéré avec succès", eventEntity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion SMS");
            return (false, ex.Message, null);
        }
    }

    public async Task<bool> SendSmsAsync(string to, string body, Guid userId)
    {
        var provider = _configuration["Messaging:SmsProvider"]?.Trim().ToLowerInvariant();

        if (provider == "vonage")
        {
            return await SendSmsWithVonageAsync(to, body);
        }

        return await SendSmsWithTwilioAsync(to, body);
    }

    private async Task<bool> SendSmsWithTwilioAsync(string to, string body)
    {
        try
        {
            var accountSid = _configuration["Twilio:AccountSid"];
            var fromNumber = _configuration["Twilio:PhoneNumber"];

            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(fromNumber))
            {
                _logger.LogWarning("Configuration Twilio manquante");
                return false;
            }

            var authHeader = BuildTwilioAuthorizationHeader();
            if (authHeader == null)
            {
                _logger.LogWarning("Credentials Twilio manquants (Twilio:ApiKeySid/Twilio:ApiKeySecret ou Twilio:AuthToken)");
                return false;
            }

            var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
            
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("To", to),
                new KeyValuePair<string, string>("From", fromNumber),
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
                _logger.LogInformation("SMS envoyé à {To}", to);
                return true;
            }

            _logger.LogWarning("Échec envoi SMS: {Status}", response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi SMS");
            return false;
        }
    }

    private async Task<bool> SendSmsWithVonageAsync(string to, string body)
    {
        try
        {
            var apiKey = _configuration["Vonage:ApiKey"];
            var apiSecret = _configuration["Vonage:ApiSecret"];
            var from = _configuration["Vonage:From"];

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret) || string.IsNullOrWhiteSpace(from))
            {
                _logger.LogWarning("Configuration Vonage manquante (Vonage:ApiKey, Vonage:ApiSecret, Vonage:From)");
                return false;
            }

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("api_key", apiKey),
                new KeyValuePair<string, string>("api_secret", apiSecret),
                new KeyValuePair<string, string>("from", from),
                new KeyValuePair<string, string>("to", to),
                new KeyValuePair<string, string>("text", body)
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://rest.nexmo.com/sms/json")
            {
                Content = content
            };

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Échec envoi Vonage: {Status}", response.StatusCode);
                return false;
            }

            using var document = JsonDocument.Parse(responseBody);
            if (!document.RootElement.TryGetProperty("messages", out var messages) || messages.ValueKind != JsonValueKind.Array || messages.GetArrayLength() == 0)
            {
                _logger.LogWarning("Réponse Vonage inattendue");
                return false;
            }

            var firstMessage = messages[0];
            var status = firstMessage.TryGetProperty("status", out var statusElement) ? statusElement.GetString() : null;
            if (status == "0")
            {
                _logger.LogInformation("SMS envoyé via Vonage à {To}", to);
                return true;
            }

            var errorText = firstMessage.TryGetProperty("error-text", out var errorElement)
                ? errorElement.GetString()
                : "unknown";

            _logger.LogWarning("Échec envoi Vonage: status={Status} error={Error}", status, errorText);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi SMS via Vonage");
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
