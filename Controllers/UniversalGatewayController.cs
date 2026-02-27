using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/gateway")]
public class UniversalGatewayController : ControllerBase
{
    private readonly UniversalGatewayService _gateway;
    private readonly SignalCommandCenterService _signalService;
    private readonly ILogger<UniversalGatewayController> _logger;

    public UniversalGatewayController(
        UniversalGatewayService gateway,
        SignalCommandCenterService signalService,
        ILogger<UniversalGatewayController> logger)
    {
        _gateway = gateway;
        _signalService = signalService;
        _logger = logger;
    }

    /// <summary>
    /// Webhook universel - Reçoit les messages de TOUS les canaux
    /// </summary>
    [HttpPost("ingest")]
    [AllowAnonymous]
    public async Task<IActionResult> IngestMessage([FromBody] UniversalIngestRequest request)
    {
        try
        {
            if (!request.IsValid())
                return BadRequest(new { message = "Canal invalide ou données manquantes" });

            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                // Webhook externe: valider API key depuis header
                var apiKey = Request.Headers["X-API-Key"].FirstOrDefault();
                var validKey = HttpContext.RequestServices.GetService<IConfiguration>()?["Gateway:ApiKey"];
                
                if (string.IsNullOrEmpty(apiKey) || apiKey != validKey)
                    return Unauthorized(new { message = "API key requise dans header X-API-Key" });
                
                var defaultUserId = HttpContext.RequestServices.GetService<IConfiguration>()?["Gateway:DefaultUserId"];
                if (!Guid.TryParse(defaultUserId, out userId))
                    return BadRequest(new { message = "Configuration userId manquante" });
            }

            var result = await _gateway.IngestUniversalMessageAsync(
                request.Channel,
                request.From,
                request.FromName,
                request.Text,
                request.ExternalId,
                userId,
                request.Metadata);

            if (result.Success)
            {
                if (!string.Equals(request.Channel, "signal", StringComparison.OrdinalIgnoreCase))
                {
                    await _signalService.ForwardInboundToConfiguredRecipientAsync(
                        request.Channel,
                        request.From,
                        request.Text);
                }

                return Ok(new { message = result.Message, eventId = result.EventId });
            }

            return BadRequest(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur ingestion universelle");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// Envoi universel - Envoie un message sur N'IMPORTE QUEL canal
    /// </summary>
    [HttpPost("send")]
    [Authorize]
    public async Task<IActionResult> SendMessage([FromBody] UniversalSendRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var success = await _gateway.SendUniversalMessageAsync(
                request.Channel,
                request.To,
                request.Text,
                userId);

            if (success)
                return Ok(new { message = $"Message envoyé via {request.Channel}" });

            return BadRequest(new { message = "Échec envoi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi universel");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Inbox unifiée - Tous les messages de TOUS les canaux
    /// </summary>
    [HttpGet("inbox")]
    [Authorize]
    public async Task<IActionResult> GetUnifiedInbox([FromQuery] int limit = 50)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var messages = await _gateway.GetUnifiedInboxAsync(userId, limit);

            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur récupération inbox");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}

public record UniversalIngestRequest(
    string Channel,
    string From,
    string? FromName,
    string Text,
    string ExternalId,
    Dictionary<string, string>? Metadata)
{
    public bool IsValid() => 
        !string.IsNullOrWhiteSpace(Channel) && 
        !string.IsNullOrWhiteSpace(From) && 
        !string.IsNullOrWhiteSpace(ExternalId) &&
        new[] { "signal", "sms", "whatsapp", "telegram", "messenger", "email", "web", "phone" }
            .Contains(Channel.ToLower());
};

public record UniversalSendRequest(
    string Channel,
    string To,
    string Text);
