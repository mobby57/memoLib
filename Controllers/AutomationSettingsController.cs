using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/automation")]
public class AutomationSettingsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public AutomationSettingsController(MemoLibDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var userId = GetUserId();
        var settings = await _context.UserAutomationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserAutomationSettings
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserAutomationSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(settings);
    }

    [HttpPatch("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UserAutomationSettings request)
    {
        var userId = GetUserId();
        var settings = await _context.UserAutomationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserAutomationSettings
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserAutomationSettings.Add(settings);
        }

        settings.AutoMonitorEmails = request.AutoMonitorEmails;
        settings.EmailCheckIntervalSeconds = request.EmailCheckIntervalSeconds;
        settings.AutoCreateCaseFromEmail = request.AutoCreateCaseFromEmail;
        settings.AutoCreateClientFromEmail = request.AutoCreateClientFromEmail;
        settings.AutoExtractClientInfo = request.AutoExtractClientInfo;
        settings.AutoAssignCases = request.AutoAssignCases;
        settings.DefaultAssignedUserId = request.DefaultAssignedUserId;
        settings.AutoSetPriority = request.AutoSetPriority;
        settings.DefaultPriority = request.DefaultPriority;
        settings.AutoAddTags = request.AutoAddTags;
        settings.DefaultTags = request.DefaultTags;
        settings.EnableNotifications = request.EnableNotifications;
        settings.NotifyNewEmail = request.NotifyNewEmail;
        settings.NotifyCaseAssigned = request.NotifyCaseAssigned;
        settings.NotifyHighPriority = request.NotifyHighPriority;
        settings.NotifyDeadlineApproaching = request.NotifyDeadlineApproaching;
        settings.AutoForwardToSignal = request.AutoForwardToSignal;
        settings.SignalPhoneNumber = request.SignalPhoneNumber;
        settings.AutoReplyEnabled = request.AutoReplyEnabled;
        settings.AutoReplyMessage = request.AutoReplyMessage;
        settings.AutoMergeDuplicateCases = request.AutoMergeDuplicateCases;
        settings.AutoMergeDuplicateClients = request.AutoMergeDuplicateClients;
        settings.EnableSemanticSearch = request.EnableSemanticSearch;
        settings.EnableEmbeddings = request.EnableEmbeddings;
        settings.RequireApprovalForDelete = request.RequireApprovalForDelete;
        settings.RequireApprovalForExport = request.RequireApprovalForExport;
        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(settings);
    }

    [HttpPost("settings/reset")]
    public async Task<IActionResult> ResetToDefaults()
    {
        var userId = GetUserId();
        var settings = await _context.UserAutomationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings != null)
        {
            _context.UserAutomationSettings.Remove(settings);
            await _context.SaveChangesAsync();
        }

        var defaultSettings = new UserAutomationSettings
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.UserAutomationSettings.Add(defaultSettings);
        await _context.SaveChangesAsync();

        return Ok(defaultSettings);
    }

    [HttpGet("settings/presets")]
    public IActionResult GetPresets()
    {
        return Ok(new
        {
            conservative = new
            {
                name = "Conservateur",
                description = "Automatisation minimale, contrôle manuel maximum",
                autoMonitorEmails = true,
                autoCreateCaseFromEmail = false,
                autoCreateClientFromEmail = false,
                autoExtractClientInfo = true,
                autoAssignCases = false,
                autoMergeDuplicateCases = false,
                enableNotifications = true
            },
            balanced = new
            {
                name = "Équilibré",
                description = "Automatisation modérée avec contrôle",
                autoMonitorEmails = true,
                autoCreateCaseFromEmail = true,
                autoCreateClientFromEmail = true,
                autoExtractClientInfo = true,
                autoAssignCases = false,
                autoMergeDuplicateCases = false,
                enableNotifications = true
            },
            aggressive = new
            {
                name = "Agressif",
                description = "Automatisation maximale, intervention minimale",
                autoMonitorEmails = true,
                autoCreateCaseFromEmail = true,
                autoCreateClientFromEmail = true,
                autoExtractClientInfo = true,
                autoAssignCases = true,
                autoMergeDuplicateCases = true,
                enableNotifications = true
            }
        });
    }
}
