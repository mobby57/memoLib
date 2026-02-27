using System.Text.Json;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class MessengerIntegrationService
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<MessengerIntegrationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public MessengerIntegrationService(
        MemoLibDbContext dbContext,
        ILogger<MessengerIntegrationService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<(bool Success, string Message, Guid? EventId)> IngestMessengerMessageAsync(
        string senderId,
        string? senderName,
        string text,
        string messageId,
        Guid userId)
    {
        try
        {
            var source = await GetOrCreateSourceAsync(userId, "messenger");
            var externalId = $"FB-{messageId}";

            var existing = await _dbContext.Events
                .FirstOrDefaultAsync(e => e.ExternalId == externalId && e.SourceId == source.Id);

            if (existing != null)
                return (false, "Message déjà ingéré", existing.Id);

            var clientEmail = $"messenger.{senderId}@memolib.local";
            var client = await _dbContext.Clients
                .FirstOrDefaultAsync(c => c.Email == clientEmail && c.UserId == userId);

            if (client == null)
            {
                client = new Client
                {
                    Id = Guid.NewGuid(),
                    Name = senderName ?? $"User {senderId}",
                    Email = clientEmail,
                    PhoneNumber = $"+FB{senderId}",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Clients.Add(client);
            }

            var caseTitle = $"Messenger - {client.Name}";
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

            var payload = JsonSerializer.Serialize(new { senderId, senderName, text, messageId, type = "messenger" });

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                SourceId = source.Id,
                ExternalId = externalId,
                Checksum = ComputeChecksum(payload),
                OccurredAt = DateTime.UtcNow,
                IngestedAt = DateTime.UtcNow,
                RawPayload = payload,
                EventType = "MESSENGER",
                Severity = 2,
                TextForEmbedding = text,
                ValidationFlags = string.IsNullOrWhiteSpace(text) ? "MISSING_TEXT" : null,
                RequiresAttention = string.IsNullOrWhiteSpace(text)
            };

            _dbContext.Events.Add(eventEntity);
            _dbContext.CaseEvents.Add(new CaseEvent { CaseId = caseEntity.Id, EventId = eventEntity.Id });

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Message Messenger ingéré: {MessageId} de {SenderId}", messageId, senderId);

            return (true, "Message ingéré avec succès", eventEntity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion Messenger");
            return (false, ex.Message, null);
        }
    }

    public async Task<bool> SendMessengerMessageAsync(string recipientId, string text)
    {
        try
        {
            var pageAccessToken = _configuration["Messenger:PageAccessToken"];
            if (string.IsNullOrEmpty(pageAccessToken))
            {
                _logger.LogWarning("Token Messenger manquant");
                return false;
            }

            var url = $"https://graph.facebook.com/v18.0/me/messages?access_token={pageAccessToken}";
            var body = JsonSerializer.Serialize(new
            {
                recipient = new { id = recipientId },
                message = new { text }
            });

            var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Message Messenger envoyé à {RecipientId}", recipientId);
                return true;
            }

            _logger.LogWarning("Échec envoi Messenger: {Status}", response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi Messenger");
            return false;
        }
    }

    private async Task<Source> GetOrCreateSourceAsync(Guid userId, string sourceType)
    {
        var source = await _dbContext.Sources
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Type == sourceType);

        if (source != null)
            return source;

        source = new Source { Id = Guid.NewGuid(), UserId = userId, Type = sourceType };
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
