using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/signal")]
public class SignalController : ControllerBase
{
    private readonly SignalCommandCenterService _signalService;
    private readonly UniversalGatewayService _gateway;
    private readonly ILogger<SignalController> _logger;

    public SignalController(
        SignalCommandCenterService signalService,
        UniversalGatewayService gateway,
        ILogger<SignalController> logger)
    {
        _signalService = signalService;
        _gateway = gateway;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] SignalWebhookPayload payload)
    {
        try
        {
            if (payload.Envelope?.DataMessage?.Message == null)
                return Ok();

            var message = payload.Envelope.DataMessage.Message;
            var from = payload.Envelope.Source ?? payload.Envelope.SourceNumber ?? "unknown";

            _logger.LogInformation("Message Signal reçu de {From}: {Message}", from, message);

            var userId = GetUserIdFromSignalNumber(from);

            // Si c'est une commande (commence par /)
            if (message.StartsWith("/"))
            {
                var response = await _signalService.ProcessCommandAsync(message, from, userId);
                await _signalService.SendSignalMessageAsync(from, response);
                return Ok();
            }

            // Sinon, ingérer comme message normal
            var result = await _gateway.IngestUniversalMessageAsync(
                "signal",
                from,
                payload.Envelope.SourceName,
                message,
                payload.Envelope.Timestamp.ToString(),
                userId);

            if (result.Success)
            {
                await _signalService.SendSignalMessageAsync(from, "✅ Message reçu et enregistré");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur webhook Signal");
            return Ok();
        }
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendSignalRequest request)
    {
        var success = await _signalService.SendSignalMessageAsync(request.To, request.Text);

        if (success)
            return Ok(new { message = "Message envoyé" });

        return BadRequest(new { message = "Échec envoi" });
    }

    private Guid GetUserIdFromSignalNumber(string number)
    {
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}

public class SignalWebhookPayload
{
    public SignalEnvelope? Envelope { get; set; }
}

public class SignalEnvelope
{
    public string? Source { get; set; }
    public string? SourceNumber { get; set; }
    public string? SourceName { get; set; }
    public long Timestamp { get; set; }
    public SignalDataMessage? DataMessage { get; set; }
}

public class SignalDataMessage
{
    public string? Message { get; set; }
}

public record SendSignalRequest(string To, string Text);
