using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/export")]
public class ExportController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public ExportController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("events-text")]
    public async Task<IActionResult> ExportText()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var userSourceIds = await _context.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var data = await _context.Events
            .AsNoTracking()
            .Where(e => userSourceIds.Contains(e.SourceId))
            .Select(e => new
            {
                e.Id,
                e.TextForEmbedding
            })
            .ToListAsync();

        return Ok(data);
    }
}
