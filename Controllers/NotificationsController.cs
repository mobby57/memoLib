using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly RoleBasedNotificationService _notificationService;

    public NotificationsController(RoleBasedNotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // GET /api/notifications/unread
    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread()
    {
        var notifications = await _notificationService.GetUnreadNotifications(GetUserId());
        return Ok(new { notifications, count = notifications.Count });
    }

    // GET /api/notifications/count
    [HttpGet("count")]
    public async Task<IActionResult> GetCount()
    {
        var count = await _notificationService.CountUnread(GetUserId());
        return Ok(new { count });
    }

    // POST /api/notifications/{id}/read
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        await _notificationService.MarkAsRead(id, GetUserId());
        return Ok(new { message = "Notification marquée comme lue" });
    }

    // POST /api/notifications/read-all
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsRead(GetUserId());
        return Ok(new { message = "Toutes les notifications marquées comme lues" });
    }
}
