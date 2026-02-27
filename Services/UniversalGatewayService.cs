using System.Text.Json;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class UniversalGatewayService
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<UniversalGatewayService> _logger;
    private readonly TelegramIntegrationService _telegram;
    private readonly MessengerIntegrationService _messenger;
    private readonly SmsIntegrationService _sms;
    private readonly WhatsAppIntegrationService _whatsapp;

    public UniversalGatewayService(
        MemoLibDbContext dbContext,
        ILogger<UniversalGatewayService> logger,
        TelegramIntegrationService telegram,
        MessengerIntegrationService messenger,
        SmsIntegrationService sms,
        WhatsAppIntegrationService whatsapp)
    {
        _dbContext = dbContext;
        _logger = logger;
        _telegram = telegram;
        _messenger = messenger;
        _sms = sms;
        _whatsapp = whatsapp;
    }

    public async Task<(bool Success, string Message, Guid? EventId)> IngestUniversalMessageAsync(
        string channel,
        string from,
        string? fromName,
        string text,
        string externalId,
        Guid userId,
        Dictionary<string, string>? metadata = null)
    {
        try
        {
            _logger.LogInformation("Message universel reçu - Canal: {Channel}, De: {From}", channel, from);

            // Créer l'événement unifié
            var source = await GetOrCreateSourceAsync(userId, "universal");
            var fullExternalId = $"{channel.ToUpper()}-{externalId}";

            var existing = await _dbContext.Events
                .FirstOrDefaultAsync(e => e.ExternalId == fullExternalId && e.SourceId == source.Id);

            if (existing != null)
                return (false, "Message déjà ingéré", existing.Id);

            // Créer ou récupérer le client
            var clientEmail = $"{channel}.{from.Replace("+", "").Replace(" ", "")}@memolib.local";
            var client = await _dbContext.Clients
                .FirstOrDefaultAsync(c => c.Email == clientEmail && c.UserId == userId);

            if (client == null)
            {
                client = new Client
                {
                    Id = Guid.NewGuid(),
                    Name = fromName ?? $"Client {channel} {from}",
                    Email = clientEmail,
                    PhoneNumber = from,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Clients.Add(client);
            }

            // Créer ou récupérer le dossier
            var caseTitle = $"{GetChannelEmoji(channel)} {channel} - {client.Name}";
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
                channel,
                from,
                fromName,
                text,
                externalId,
                metadata,
                type = "universal"
            });

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                SourceId = source.Id,
                ExternalId = fullExternalId,
                Checksum = ComputeChecksum(payload),
                OccurredAt = DateTime.UtcNow,
                IngestedAt = DateTime.UtcNow,
                RawPayload = payload,
                EventType = channel.ToUpper(),
                Severity = 2,
                TextForEmbedding = text,
                ValidationFlags = string.IsNullOrWhiteSpace(text) ? "MISSING_TEXT" : null,
                RequiresAttention = string.IsNullOrWhiteSpace(text)
            };

            _dbContext.Events.Add(eventEntity);
            _dbContext.CaseEvents.Add(new CaseEvent { CaseId = caseEntity.Id, EventId = eventEntity.Id });

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Message universel ingéré: {Channel} - {ExternalId}", channel, fullExternalId);

            return (true, "Message ingéré avec succès", eventEntity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion universelle");
            return (false, ex.Message, null);
        }
    }

    public async Task<bool> SendUniversalMessageAsync(string channel, string to, string text, Guid userId)
    {
        try
        {
            _logger.LogInformation("Envoi message universel - Canal: {Channel}, Vers: {To}", channel, to);

            return channel.ToLower() switch
            {
                "telegram" => await _telegram.SendTelegramMessageAsync(long.Parse(to), text),
                "messenger" => await _messenger.SendMessengerMessageAsync(to, text),
                "sms" => await _sms.SendSmsAsync(to, text, userId),
                "whatsapp" => await _whatsapp.SendWhatsAppMessageAsync(to, text, userId),
                _ => throw new NotSupportedException($"Canal non supporté: {channel}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi universel");
            return false;
        }
    }

    public async Task<List<UniversalMessage>> GetUnifiedInboxAsync(Guid userId, int limit = 50)
    {
        var sources = await _dbContext.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var events = await _dbContext.Events
            .Where(e => sources.Contains(e.SourceId))
            .OrderByDescending(e => e.OccurredAt)
            .Take(limit)
            .ToListAsync();

        return events.Select(e => new UniversalMessage
        {
            Id = e.Id,
            Channel = e.EventType ?? string.Empty,
            Text = e.TextForEmbedding ?? "",
            OccurredAt = e.OccurredAt,
            ExternalId = e.ExternalId ?? string.Empty
        }).ToList();
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

    private static string GetChannelEmoji(string channel)
    {
        return channel.ToLower() switch
        {
            "email" => "📧",
            "sms" => "📱",
            "whatsapp" => "💚",
            "telegram" => "✈️",
            "messenger" => "💬",
            "signal" => "🔒",
            "instagram" => "📷",
            "linkedin" => "💼",
            _ => "📨"
        };
    }
}

public class UniversalMessage
{
    public Guid Id { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string ExternalId { get; set; } = string.Empty;
}
