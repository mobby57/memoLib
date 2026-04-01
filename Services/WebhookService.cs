using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MemoLib.Api.Services;

public class WebhookService
{
    private readonly MemoLibDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(MemoLibDbContext context, IHttpClientFactory httpClientFactory, ILogger<WebhookService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task TriggerWebhooksAsync(Guid userId, string eventType, object payload)
    {
        var webhooks = await _context.Webhooks
            .Where(w => w.UserId == userId && w.IsActive && w.Event == eventType)
            .ToListAsync();

        foreach (var webhook in webhooks)
        {
            _ = Task.Run(async () => await SendWebhookAsync(webhook, eventType, payload));
        }
    }

    private async Task SendWebhookAsync(Webhook webhook, string eventType, object payload)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var json = JsonSerializer.Serialize(new
            {
                @event = eventType,
                timestamp = DateTime.UtcNow,
                data = payload
            });

            var signature = GenerateSignature(json, webhook.Secret);

            var request = new HttpRequestMessage(HttpMethod.Post, webhook.Url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("X-Webhook-Signature", signature);
            request.Headers.Add("X-Webhook-Event", eventType);

            var response = await client.SendAsync(request);

            webhook.LastTriggeredAt = DateTime.UtcNow;
            webhook.TriggerCount++;

            _context.WebhookLogs.Add(new WebhookLog
            {
                Id = Guid.NewGuid(),
                WebhookId = webhook.Id,
                Event = eventType,
                Payload = json,
                StatusCode = (int)response.StatusCode,
                Response = await response.Content.ReadAsStringAsync(),
                Success = response.IsSuccessStatusCode,
                TriggeredAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            _logger.LogInformation("Webhook triggered: {Url} - {Event} - {StatusCode}", 
                webhook.Url, eventType, response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering webhook: {Url} - {Event}", webhook.Url, eventType);

            _context.WebhookLogs.Add(new WebhookLog
            {
                Id = Guid.NewGuid(),
                WebhookId = webhook.Id,
                Event = eventType,
                Payload = JsonSerializer.Serialize(payload),
                StatusCode = 0,
                Response = ex.Message,
                Success = false,
                TriggeredAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }

    private string GenerateSignature(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }
}
