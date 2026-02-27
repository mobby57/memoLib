using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/integrations")]
public class IntegrationsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public IntegrationsController(MemoLibDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetIntegrations()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var integrations = await _context.Integrations
            .Where(i => i.UserId == userId)
            .Select(i => new
            {
                i.Id,
                i.Provider,
                i.IsActive,
                i.ConnectedAt,
                i.ExpiresAt,
                Settings = i.Settings
            })
            .ToListAsync();
        return Ok(integrations);
    }

    [HttpPost]
    public async Task<IActionResult> CreateIntegration([FromBody] Integration integration)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        integration.UserId = userId;
        integration.ConnectedAt = DateTime.UtcNow;
        
        _context.Integrations.Add(integration);
        await _context.SaveChangesAsync();
        return Ok(integration);
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var integration = await _context.Integrations.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (integration == null) return NotFound();

        integration.IsActive = !integration.IsActive;
        await _context.SaveChangesAsync();
        return Ok(integration);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteIntegration(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var integration = await _context.Integrations.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (integration == null) return NotFound();

        _context.Integrations.Remove(integration);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/refresh")]
    public async Task<IActionResult> RefreshToken(Guid id, [FromBody] RefreshTokenRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var integration = await _context.Integrations.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (integration == null) return NotFound();

        integration.AccessToken = request.AccessToken;
        integration.RefreshToken = request.RefreshToken;
        integration.ExpiresAt = request.ExpiresAt;

        await _context.SaveChangesAsync();
        return Ok(integration);
    }
}

public record RefreshTokenRequest(string AccessToken, string? RefreshToken, DateTime? ExpiresAt);
