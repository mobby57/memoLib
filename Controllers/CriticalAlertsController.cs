using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MemoLib.Api.Hubs;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CriticalAlertsController : ControllerBase
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly EmailValidationService _emailService;

    public CriticalAlertsController(IHubContext<NotificationHub> hubContext, EmailValidationService emailService)
    {
        _hubContext = hubContext;
        _emailService = emailService;
    }

    [HttpPost("urgent")]
    public async Task<IActionResult> SendUrgentAlert([FromBody] UrgentAlertRequest request)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Notification temps réel
        await _hubContext.Clients.User(userId).SendAsync("UrgentAlert", new
        {
            message = request.Message,
            priority = "CRITICAL",
            timestamp = DateTime.UtcNow,
            sound = "urgent-alert.mp3"
        });

        // Email urgent si demandé
        if (request.SendEmail && !string.IsNullOrEmpty(request.Email))
        {
            // TODO: Implémenter SendUrgentEmailAsync dans EmailValidationService
            // await _emailService.SendUrgentEmailAsync(request.Email, request.Subject, request.Message);
        }

        return Ok(new { sent = true, timestamp = DateTime.UtcNow, channels = GetSentChannels(request) });
    }

    [HttpPost("deadline")]
    public async Task<IActionResult> CreateDeadlineAlert([FromBody] DeadlineAlertRequest request)
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _hubContext.Clients.User(userId).SendAsync("DeadlineAlert", new
        {
            caseId = request.CaseId,
            deadline = request.Deadline,
            daysRemaining = (request.Deadline - DateTime.Now).Days,
            priority = request.Deadline <= DateTime.Now.AddDays(3) ? "HIGH" : "MEDIUM"
        });

        return Ok(new { scheduled = true, deadline = request.Deadline });
    }

    private static List<string> GetSentChannels(UrgentAlertRequest request)
    {
        var channels = new List<string> { "realtime" };
        if (request.SendEmail) channels.Add("email");
        return channels;
    }
}

public record UrgentAlertRequest(string Message, string Subject = "Alerte Urgente", bool SendEmail = false, string? Email = null);
public record DeadlineAlertRequest(Guid CaseId, DateTime Deadline, string Description);