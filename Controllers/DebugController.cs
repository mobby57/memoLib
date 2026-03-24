using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DebugController(MemoLibDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPwdRequest req)
    {

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email.Trim().ToLowerInvariant());
        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

        var pwdService = HttpContext.RequestServices.GetRequiredService<MemoLib.Api.Services.PasswordService>();
        user.Password = pwdService.HashPassword(req.NewPassword);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Mot de passe mis a jour", email = user.Email });
    }

    public record ResetPwdRequest(string Email, string NewPassword);

    [HttpPost("verify-email")]
    public async Task<IActionResult> ForceVerifyEmail([FromBody] ForceVerifyRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email.Trim().ToLowerInvariant());
        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });
        user.IsEmailVerified = true;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Email vérifié", email = user.Email });
    }

    public record ForceVerifyRequest(string Email);

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
