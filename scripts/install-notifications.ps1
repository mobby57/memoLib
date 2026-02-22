#!/usr/bin/env pwsh

Write-Host "🔔 INSTALLATION NOTIFICATIONS PUSH" -ForegroundColor Cyan

# 1. Service de notifications
$notificationService = @'
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class NotificationService
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(MemoLibDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SendNotificationAsync(Guid userId, string title, string message, string type = "INFO")
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Notification envoyée à {UserId}: {Title}", userId, title);
    }

    public async Task<List<Notification>> GetUnreadNotificationsAsync(Guid userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }
}
'@

$servicePath = "../Services/NotificationService.cs"
Set-Content -Path $servicePath -Value $notificationService -Encoding UTF8

# 2. Contrôleur notifications
$notificationController = @'
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
    private readonly NotificationService _notificationService;

    public NotificationsController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnreadNotifications()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
        return Ok(notifications);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return Ok();
    }
}
'@

$controllerPath = "../Controllers/NotificationsController.cs"
Set-Content -Path $controllerPath -Value $notificationController -Encoding UTF8

# 3. Modèle Notification
$notificationModel = @'
namespace MemoLib.Api.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = "INFO"; // INFO, WARNING, ERROR, SUCCESS
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public User User { get; set; } = null!;
}
'@

$modelPath = "../Models/Notification.cs"
Set-Content -Path $modelPath -Value $notificationModel -Encoding UTF8

# 4. Widget notifications pour l'interface
$notificationWidget = @'
<div id="notificationWidget" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
    <div id="notificationBell" style="background: #667eea; color: white; padding: 10px; border-radius: 50%; cursor: pointer; position: relative;">
        🔔
        <span id="notificationCount" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; display: none; text-align: center; line-height: 20px;"></span>
    </div>
    
    <div id="notificationPanel" style="display: none; position: absolute; top: 60px; right: 0; width: 300px; background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-height: 400px; overflow-y: auto;">
        <div style="padding: 15px; border-bottom: 1px solid #eee;">
            <h4 style="margin: 0;">Notifications</h4>
        </div>
        <div id="notificationList">
            <!-- Notifications dynamiques -->
        </div>
    </div>
</div>

<script>
let notificationWidget = {
    init() {
        document.getElementById('notificationBell').onclick = this.togglePanel.bind(this);
        this.loadNotifications();
        setInterval(() => this.loadNotifications(), 10000); // Toutes les 10 secondes
    },

    togglePanel() {
        const panel = document.getElementById('notificationPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    },

    async loadNotifications() {
        try {
            const token = localStorage.getItem('memolib_token');
            const response = await fetch('/api/notifications/unread', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) return;
            
            const notifications = await response.json();
            this.updateUI(notifications);
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        }
    },

    updateUI(notifications) {
        const count = document.getElementById('notificationCount');
        const list = document.getElementById('notificationList');
        
        if (notifications.length > 0) {
            count.textContent = notifications.length;
            count.style.display = 'block';
            
            list.innerHTML = notifications.map(n => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="notificationWidget.markAsRead('${n.id}')">
                    <div style="font-weight: bold; color: #333;">${n.title}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">${n.message}</div>
                    <div style="font-size: 11px; color: #999; margin-top: 5px;">${new Date(n.createdAt).toLocaleString()}</div>
                </div>
            `).join('');
        } else {
            count.style.display = 'none';
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Aucune notification</div>';
        }
    },

    async markAsRead(id) {
        try {
            const token = localStorage.getItem('memolib_token');
            await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            this.loadNotifications();
        } catch (error) {
            console.error('Erreur marquage notification:', error);
        }
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => notificationWidget.init());
</script>
'@

$widgetPath = "../wwwroot/notification-widget.html"
Set-Content -Path $widgetPath -Value $notificationWidget -Encoding UTF8

Write-Host "✅ Notifications push installées!" -ForegroundColor Green
Write-Host "🔔 Widget disponible dans notification-widget.html" -ForegroundColor Cyan