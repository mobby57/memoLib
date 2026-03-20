using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace MemoLib.Api.Services.Integration;

public interface IWebhookService
{
    Task<bool> ProcessWebhookAsync(string source, string payload, string signature);
    bool ValidateSignature(string payload, string signature, string secret);
}

public class WebhookService : IWebhookService
{
    private readonly ILogger<WebhookService> _logger;
    private readonly IConfiguration _config;

    public WebhookService(ILogger<WebhookService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public async Task<bool> ProcessWebhookAsync(string source, string payload, string signature)
    {
        var secret = _config[$"Webhooks:{source}:Secret"];
        if (string.IsNullOrEmpty(secret) || !ValidateSignature(payload, signature, secret))
        {
            _logger.LogWarning("Invalid webhook signature from {Source}", source);
            return false;
        }

        return source switch
        {
            "gmail" => await ProcessGmailWebhookAsync(payload),
            "docusign" => await ProcessDocuSignWebhookAsync(payload),
            "payment" => await ProcessPaymentWebhookAsync(payload),
            _ => false
        };
    }

    public bool ValidateSignature(string payload, string signature, string secret)
    {
        var expectedSignature = ComputeHmacSha256(payload, secret);
        return signature.Equals($"sha256={expectedSignature}", StringComparison.OrdinalIgnoreCase);
    }

    private Task<bool> ProcessGmailWebhookAsync(string payload)
    {
        _logger.LogInformation("Processing Gmail webhook");
        return Task.FromResult(true);
    }

    private Task<bool> ProcessDocuSignWebhookAsync(string payload)
    {
        _logger.LogInformation("Processing DocuSign webhook");
        return Task.FromResult(true);
    }

    private Task<bool> ProcessPaymentWebhookAsync(string payload)
    {
        _logger.LogInformation("Processing Payment webhook");
        return Task.FromResult(true);
    }

    private string ComputeHmacSha256(string data, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLower();
    }
}

[ApiController]
[Route("api/webhooks")]
public class WebhookController : ControllerBase
{
    private readonly IWebhookService _webhookService;

    public WebhookController(IWebhookService webhookService)
    {
        _webhookService = webhookService;
    }

    [HttpPost("{source}")]
    public async Task<IActionResult> ReceiveWebhook(string source, [FromBody] object payload)
    {
        var signature = Request.Headers["X-Hub-Signature-256"].FirstOrDefault() ?? "";
        var payloadString = payload.ToString() ?? "";
        
        var success = await _webhookService.ProcessWebhookAsync(source, payloadString, signature);
        return success ? Ok() : BadRequest();
    }
}