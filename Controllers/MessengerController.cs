using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/messenger")]
public class MessengerController : ControllerBase
{
    private readonly MessengerIntegrationService _messengerService;
    private readonly SignalCommandCenterService _signalService;
    private readonly ILogger<MessengerController> _logger;
    private readonly IConfiguration _configuration;

    public MessengerController(
        MessengerIntegrationService messengerService,
        SignalCommandCenterService signalService,
        ILogger<MessengerController> logger,
        IConfiguration configuration)
    {
        _messengerService = messengerService;
        _signalService = signalService;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("webhook")]
    public IActionResult WebhookVerification([FromQuery(Name = "hub.mode")] string mode,
        [FromQuery(Name = "hub.verify_token")] string token,
        [FromQuery(Name = "hub.challenge")] string challenge)
    {
        var verifyToken = _configuration["Messenger:VerifyToken"];
        
        if (mode == "subscribe" && token == verifyToken)
        {
            _logger.LogInformation("Webhook Messenger vérifié");
            return Content(challenge);
        }

        return Unauthorized();
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] MessengerWebhookPayload payload)
    {
        try
        {
            if (payload.Object != "page")
                return Ok();

            foreach (var entry in payload.Entry ?? Array.Empty<MessengerEntry>())
            {
                foreach (var messaging in entry.Messaging ?? Array.Empty<MessengerMessaging>())
                {
                    if (messaging.Message?.Text == null)
                        continue;

                    _logger.LogInformation("Message Messenger reçu de {SenderId}: {Text}",
                        messaging.Sender.Id, messaging.Message.Text);

                    var userId = GetUserIdFromSenderId(messaging.Sender.Id);

                    var result = await _messengerService.IngestMessengerMessageAsync(
                        messaging.Sender.Id,
                        null,
                        messaging.Message.Text,
                        messaging.Message.Mid,
                        userId);

                    if (result.Success)
                    {
                        await _signalService.ForwardInboundToConfiguredRecipientAsync(
                            "messenger",
                            messaging.Sender.Id,
                            messaging.Message.Text);
                    }
                }
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur webhook Messenger");
            return Ok();
        }
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessengerRequest request)
    {
        var success = await _messengerService.SendMessengerMessageAsync(request.RecipientId, request.Text);

        if (success)
            return Ok(new { message = "Message envoyé" });

        return BadRequest(new { message = "Échec envoi" });
    }

    private Guid GetUserIdFromSenderId(string senderId)
    {
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}

public class MessengerWebhookPayload
{
    public string Object { get; set; } = string.Empty;
    public MessengerEntry[]? Entry { get; set; }
}

public class MessengerEntry
{
    public string Id { get; set; } = string.Empty;
    public long Time { get; set; }
    public MessengerMessaging[]? Messaging { get; set; }
}

public class MessengerMessaging
{
    public MessengerSender Sender { get; set; } = null!;
    public MessengerRecipient Recipient { get; set; } = null!;
    public long Timestamp { get; set; }
    public MessengerMessage? Message { get; set; }
}

public class MessengerSender
{
    public string Id { get; set; } = string.Empty;
}

public class MessengerRecipient
{
    public string Id { get; set; } = string.Empty;
}

public class MessengerMessage
{
    public string Mid { get; set; } = string.Empty;
    public string? Text { get; set; }
}

public record SendMessengerRequest(string RecipientId, string Text);
