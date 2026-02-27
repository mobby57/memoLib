using System.Text.Json;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class TelegramIntegrationService
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<TelegramIntegrationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public TelegramIntegrationService(
        MemoLibDbContext dbContext,
        ILogger<TelegramIntegrationService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<(bool Success, string Message, Guid? EventId)> IngestTelegramMessageAsync(
        long chatId,
        string? username,
        string? firstName,
        string text,
        long messageId,
        Guid userId)
    {
        try
        {
            var source = await GetOrCreateSourceAsync(userId, "telegram");
            var externalId = $"TG-{messageId}";

            var existing = await _dbContext.Events
                .FirstOrDefaultAsync(e => e.ExternalId == externalId && e.SourceId == source.Id);

            if (existing != null)
                return (false, "Message déjà ingéré", existing.Id);

            var clientName = !string.IsNullOrEmpty(firstName) ? firstName : username ?? $"User {chatId}";
            var clientEmail = $"telegram.{chatId}@memolib.local";

            var client = await _dbContext.Clients
                .FirstOrDefaultAsync(c => c.Email == clientEmail && c.UserId == userId);

            if (client == null)
            {
                client = new Client
                {
                    Id = Guid.NewGuid(),
                    Name = clientName,
                    Email = clientEmail,
                    PhoneNumber = $"+TG{chatId}",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Clients.Add(client);
            }

            var caseTitle = $"Telegram - {clientName}";
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

            var payload = JsonSerializer.Serialize(new
            {
                chatId,
                username,
                firstName,
                text,
                messageId,
                type = "telegram"
            });

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                SourceId = source.Id,
                ExternalId = externalId,
                Checksum = ComputeChecksum(payload),
                OccurredAt = DateTime.UtcNow,
                IngestedAt = DateTime.UtcNow,
                RawPayload = payload,
                EventType = "TELEGRAM",
                Severity = 2,
                TextForEmbedding = text,
                ValidationFlags = string.IsNullOrWhiteSpace(text) ? "MISSING_TEXT" : null,
                RequiresAttention = string.IsNullOrWhiteSpace(text)
            };

            _dbContext.Events.Add(eventEntity);
            _dbContext.CaseEvents.Add(new CaseEvent
            {
                CaseId = caseEntity.Id,
                EventId = eventEntity.Id
            });

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Message Telegram ingéré: {MessageId} de {ChatId}", messageId, chatId);

            return (true, "Message ingéré avec succès", eventEntity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion Telegram");
            return (false, ex.Message, null);
        }
    }

    public async Task<bool> SendTelegramMessageAsync(long chatId, string text)
    {
        try
        {
            var botToken = _configuration["Telegram:BotToken"];
            if (string.IsNullOrEmpty(botToken))
            {
                _logger.LogWarning("Token Telegram manquant");
                return false;
            }

            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var body = JsonSerializer.Serialize(new { chat_id = chatId, text });
            var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Message Telegram envoyé à {ChatId}", chatId);
                return true;
            }

            _logger.LogWarning("Échec envoi Telegram: {Status}", response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi Telegram");
            return false;
        }
    }

    private async Task<Source> GetOrCreateSourceAsync(Guid userId, string sourceType)
    {
        var source = await _dbContext.Sources
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Type == sourceType);

        if (source != null)
            return source;

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
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(payload ?? string.Empty));
        return Convert.ToHexString(bytes);
    }
}
