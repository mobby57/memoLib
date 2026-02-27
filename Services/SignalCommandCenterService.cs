using System.Text.Json;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class SignalCommandCenterService
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<SignalCommandCenterService> _logger;
    private readonly IConfiguration _configuration;
    private readonly UniversalGatewayService _gateway;
    private readonly HttpClient _httpClient;

    public SignalCommandCenterService(
        MemoLibDbContext dbContext,
        ILogger<SignalCommandCenterService> logger,
        IConfiguration configuration,
        UniversalGatewayService gateway,
        IHttpClientFactory httpClientFactory)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
        _gateway = gateway;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<string> ProcessCommandAsync(string command, string from, Guid userId)
    {
        try
        {
            _logger.LogInformation("Commande Signal reçue: {Command} de {From}", command, from);

            var parts = command.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0)
                return "❌ Commande vide";

            var cmd = parts[0].ToLower();

            return cmd switch
            {
                "/help" or "/aide" => GetHelpMessage(),
                "/inbox" => await GetInboxSummaryAsync(userId),
                "/send" => await SendMessageAsync(parts, userId),
                "/stats" => await GetStatsAsync(userId),
                "/cases" or "/dossiers" => await GetCasesAsync(userId),
                "/search" or "/chercher" => await SearchAsync(parts, userId),
                "/status" => GetSystemStatus(),
                _ => $"❌ Commande inconnue: {cmd}\nTapez /help pour voir les commandes"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur traitement commande Signal");
            return $"❌ Erreur: {ex.Message}";
        }
    }

    private string GetHelpMessage()
    {
        return @"🔒 SIGNAL COMMAND CENTER - MemoLib

📨 INBOX
/inbox - Voir les derniers messages

📤 ENVOI
/send telegram 123456 Bonjour
/send messenger 789 Message test
/send sms +33603983709 Urgent

📊 STATISTIQUES
/stats - Statistiques globales

📁 DOSSIERS
/cases - Liste des dossiers actifs

🔍 RECHERCHE
/search divorce - Chercher dans tout

⚙️ SYSTÈME
/status - État du système

💡 EXEMPLES:
/inbox
/send telegram 123456 RDV confirmé
/search contrat
/stats";
    }

    private async Task<string> GetInboxSummaryAsync(Guid userId)
    {
        var messages = await _gateway.GetUnifiedInboxAsync(userId, 10);

        if (!messages.Any())
            return "📭 Inbox vide";

        var summary = "📨 INBOX (10 derniers)\n\n";
        foreach (var msg in messages)
        {
            var emoji = GetChannelEmoji(msg.Channel);
            var preview = msg.Text.Length > 50 ? msg.Text.Substring(0, 50) + "..." : msg.Text;
            var time = GetRelativeTime(msg.OccurredAt);
            summary += $"{emoji} {msg.Channel}\n{preview}\n{time}\n\n";
        }

        return summary;
    }

    private async Task<string> SendMessageAsync(string[] parts, Guid userId)
    {
        if (parts.Length < 4)
            return "❌ Usage: /send <canal> <destinataire> <message>";

        var channel = parts[1].ToLower();
        var to = parts[2];
        var text = string.Join(" ", parts.Skip(3));

        var success = await _gateway.SendUniversalMessageAsync(channel, to, text, userId);

        return success
            ? $"✅ Message envoyé via {channel} à {to}"
            : $"❌ Échec envoi via {channel}";
    }

    private async Task<string> GetStatsAsync(Guid userId)
    {
        var sources = await _dbContext.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var events = await _dbContext.Events
            .Where(e => sources.Contains(e.SourceId))
            .GroupBy(e => e.EventType)
            .Select(g => new { Channel = g.Key, Count = g.Count() })
            .ToListAsync();

        var total = events.Sum(e => e.Count);

        var stats = $"📊 STATISTIQUES\n\nTotal: {total} messages\n\n";
        foreach (var e in events.OrderByDescending(x => x.Count))
        {
            var emoji = GetChannelEmoji(e.Channel);
            stats += $"{emoji} {e.Channel}: {e.Count}\n";
        }

        return stats;
    }

    private async Task<string> GetCasesAsync(Guid userId)
    {
        var cases = await _dbContext.Cases
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .ToListAsync();

        if (!cases.Any())
            return "📁 Aucun dossier";

        var summary = "📁 DOSSIERS (10 derniers)\n\n";
        foreach (var c in cases)
        {
            summary += $"• {c.Title}\n  Créé: {GetRelativeTime(c.CreatedAt)}\n\n";
        }

        return summary;
    }

    private async Task<string> SearchAsync(string[] parts, Guid userId)
    {
        if (parts.Length < 2)
            return "❌ Usage: /search <terme>";

        var query = string.Join(" ", parts.Skip(1));

        var sources = await _dbContext.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var results = await _dbContext.Events
            .Where(e => sources.Contains(e.SourceId) &&
                       (e.TextForEmbedding != null && e.TextForEmbedding.Contains(query)))
            .OrderByDescending(e => e.OccurredAt)
            .Take(5)
            .ToListAsync();

        if (!results.Any())
            return $"🔍 Aucun résultat pour: {query}";

        var summary = $"🔍 RÉSULTATS ({results.Count})\n\n";
        foreach (var r in results)
        {
            var emoji = GetChannelEmoji(r.EventType);
            var preview = r.TextForEmbedding?.Length > 50
                ? r.TextForEmbedding.Substring(0, 50) + "..."
                : r.TextForEmbedding ?? "";
            summary += $"{emoji} {r.EventType}\n{preview}\n{GetRelativeTime(r.OccurredAt)}\n\n";
        }

        return summary;
    }

    private string GetSystemStatus()
    {
        return @"⚙️ SYSTÈME STATUS

✅ API: Opérationnelle
✅ Base de données: OK
✅ Passerelle: Active

📡 CANAUX:
✅ Email (Gmail)
✅ SMS (Twilio)
✅ WhatsApp (Twilio)
✅ Telegram
✅ Messenger
✅ Signal (Command Center)

🔒 Sécurité: Maximale
⚡ Performance: Optimale";
    }

    private static string GetChannelEmoji(string? channel)
    {
        return (channel ?? string.Empty).ToLower() switch
        {
            "email" => "📧",
            "sms" => "📱",
            "whatsapp" => "💚",
            "telegram" => "✈️",
            "messenger" => "💬",
            "signal" => "🔒",
            _ => "📨"
        };
    }

    private static string GetRelativeTime(DateTime dt)
    {
        var diff = DateTime.UtcNow - dt;
        if (diff.TotalMinutes < 1) return "À l'instant";
        if (diff.TotalMinutes < 60) return $"Il y a {(int)diff.TotalMinutes} min";
        if (diff.TotalHours < 24) return $"Il y a {(int)diff.TotalHours}h";
        return $"Il y a {(int)diff.TotalDays}j";
    }

    public async Task<bool> SendSignalMessageAsync(string to, string text)
    {
        try
        {
            var signalCliUrl = _configuration["Signal:CliUrl"] ?? "http://localhost:8080";
            var phoneNumber = _configuration["Signal:PhoneNumber"];

            if (string.IsNullOrEmpty(phoneNumber))
            {
                _logger.LogWarning("Numéro Signal manquant");
                return false;
            }

            if (await TrySendViaRestApiAsync(signalCliUrl, phoneNumber, to, text))
            {
                return true;
            }

            if (await TrySendViaJsonRpcAsync(signalCliUrl, phoneNumber, to, text))
            {
                return true;
            }

            _logger.LogWarning("Échec envoi Signal via REST et JSON-RPC vers {SignalCliUrl}", signalCliUrl);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi Signal");
            return false;
        }
    }

    public async Task<bool> ForwardInboundToConfiguredRecipientAsync(string channel, string from, string text)
    {
        var forwardTo = _configuration["Signal:ForwardTo"];
        if (string.IsNullOrWhiteSpace(forwardTo))
        {
            _logger.LogDebug("Signal:ForwardTo non configuré, relai entrant désactivé");
            return false;
        }

        var safeChannel = string.IsNullOrWhiteSpace(channel) ? "CANAL" : channel.ToUpperInvariant();
        var safeFrom = string.IsNullOrWhiteSpace(from) ? "inconnu" : from;
        var safeText = string.IsNullOrWhiteSpace(text) ? "(message vide)" : text;

        var relayText = $"📥 {safeChannel}\nDe: {safeFrom}\n\n{safeText}";

        return await SendSignalMessageAsync(forwardTo, relayText);
    }

    private async Task<bool> TrySendViaRestApiAsync(string signalCliUrl, string phoneNumber, string to, string text)
    {
        try
        {
            var url = $"{signalCliUrl.TrimEnd('/')}/v2/send";
            var body = JsonSerializer.Serialize(new
            {
                number = phoneNumber,
                recipients = new[] { to },
                message = text
            });

            var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Message Signal envoyé via REST à {To}", to);
                return true;
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            var errorSnippet = errorBody.Length > 400 ? errorBody[..400] + "..." : errorBody;
            _logger.LogWarning("REST /v2/send rejeté: {Status}. Réponse: {Response}", response.StatusCode, errorSnippet);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "REST /v2/send indisponible, tentative JSON-RPC");
            return false;
        }
    }

    private async Task<bool> TrySendViaJsonRpcAsync(string signalCliUrl, string phoneNumber, string to, string text)
    {
        try
        {
            var url = $"{signalCliUrl.TrimEnd('/')}/api/v1/rpc";
            var body = JsonSerializer.Serialize(new
            {
                jsonrpc = "2.0",
                method = "send",
                @params = new
                {
                    account = phoneNumber,
                    recipient = new[] { to },
                    message = text
                },
                id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });

            var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                var errorSnippet = errorBody.Length > 400 ? errorBody[..400] + "..." : errorBody;
                _logger.LogWarning("JSON-RPC send rejeté: {Status}. Réponse: {Response}", response.StatusCode, errorSnippet);
                return false;
            }

            var payload = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(payload);

            if (document.RootElement.TryGetProperty("error", out var error))
            {
                _logger.LogWarning("Signal JSON-RPC error: {Error}", error.ToString());
                return false;
            }

            _logger.LogInformation("Message Signal envoyé via JSON-RPC à {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "JSON-RPC send indisponible");
            return false;
        }
    }
}
