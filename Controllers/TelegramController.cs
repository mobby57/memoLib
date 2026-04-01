using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/telegram")]
public class TelegramController : ControllerBase
{
    private readonly TelegramIntegrationService _telegramService;
    private readonly SignalCommandCenterService _signalService;
    private readonly ILogger<TelegramController> _logger;
    private readonly IConfiguration _configuration;

    public TelegramController(
        TelegramIntegrationService telegramService,
        SignalCommandCenterService signalService,
        ILogger<TelegramController> logger,
        IConfiguration configuration)
    {
        _telegramService = telegramService;
        _signalService = signalService;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] TelegramUpdate update)
    {
        try
        {
            if (update.Message == null || update.Message.Text == null)
                return Ok();

            _logger.LogInformation("Message Telegram reçu de {ChatId}: {Text}", 
                update.Message.Chat.Id, update.Message.Text);

            var userId = GetUserIdFromChatId(update.Message.Chat.Id);

            var result = await _telegramService.IngestTelegramMessageAsync(
                update.Message.Chat.Id,
                update.Message.From?.Username,
                update.Message.From?.FirstName,
                update.Message.Text,
                update.Message.MessageId,
                userId);

            if (result.Success)
            {
                await _signalService.ForwardInboundToConfiguredRecipientAsync(
                    "telegram",
                    update.Message.From?.Username ?? update.Message.Chat.Id.ToString(),
                    update.Message.Text);

                await _telegramService.SendTelegramMessageAsync(
                    update.Message.Chat.Id,
                    "✅ Message reçu et enregistré dans MemoLib !");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur webhook Telegram");
            return Ok();
        }
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendTelegramRequest request)
    {
        var success = await _telegramService.SendTelegramMessageAsync(request.ChatId, request.Text);

        if (success)
            return Ok(new { message = "Message envoyé" });

        return BadRequest(new { message = "Échec envoi" });
    }

    private Guid GetUserIdFromChatId(long chatId)
    {
        // TODO: Mapper chatId → userId
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }
}

public class TelegramUpdate
{
    public long UpdateId { get; set; }
    public TelegramMessage? Message { get; set; }
}

public class TelegramMessage
{
    public long MessageId { get; set; }
    public TelegramUser? From { get; set; }
    public TelegramChat Chat { get; set; } = null!;
    public string? Text { get; set; }
}

public class TelegramUser
{
    public long Id { get; set; }
    public string? FirstName { get; set; }
    public string? Username { get; set; }
}

public class TelegramChat
{
    public long Id { get; set; }
    public string? Type { get; set; }
}

public record SendTelegramRequest(long ChatId, string Text);
