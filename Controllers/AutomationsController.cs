using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/automations")]
public class AutomationsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public AutomationsController(MemoLibDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAutomations()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var automations = await _context.Automations
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
        return Ok(automations);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAutomation([FromBody] Automation automation)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        automation.UserId = userId;
        automation.CreatedAt = DateTime.UtcNow;
        
        _context.Automations.Add(automation);
        await _context.SaveChangesAsync();
        return Ok(automation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAutomation(Guid id, [FromBody] Automation updated)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var automation = await _context.Automations.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (automation == null) return NotFound();

        automation.Name = updated.Name;
        automation.TriggerType = updated.TriggerType;
        automation.TriggerConditions = updated.TriggerConditions;
        automation.ActionType = updated.ActionType;
        automation.ActionParams = updated.ActionParams;
        automation.IsActive = updated.IsActive;

        await _context.SaveChangesAsync();
        return Ok(automation);
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var automation = await _context.Automations.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (automation == null) return NotFound();

        automation.IsActive = !automation.IsActive;
        await _context.SaveChangesAsync();
        return Ok(automation);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAutomation(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var automation = await _context.Automations.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (automation == null) return NotFound();

        _context.Automations.Remove(automation);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
