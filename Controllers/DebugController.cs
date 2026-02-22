using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public DebugController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var users = await _context.Users.CountAsync();
        var cases = await _context.Cases.CountAsync();
        var events = await _context.Events.CountAsync();
        var sources = await _context.Sources.CountAsync();

        var recentCases = await _context.Cases
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .Select(c => new { c.Id, c.Title, c.CreatedAt, c.UserId })
            .ToListAsync();

        return Ok(new
        {
            users,
            cases,
            events,
            sources,
            recentCases
        });
    }
}
