using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly MemoLibDbContext _db;
    private readonly PasswordService _passwordService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(MemoLibDbContext db, PasswordService passwordService, ILogger<AccountController> logger)
    {
        _db = db;
        _passwordService = passwordService;
        _logger = logger;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>
    /// Retourne le profil complet de l'utilisateur connecté
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

        return Ok(new AccountProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            Phone = user.Phone,
            FirmName = user.FirmName,
            BarNumber = user.BarNumber,
            Address = user.Address,
            City = user.City,
            PostalCode = user.PostalCode,
            Plan = user.Plan,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Met à jour le profil de l'utilisateur connecté
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

        if (request.Name != null) user.Name = request.Name;
        if (request.Phone != null) user.Phone = request.Phone;
        if (request.FirmName != null) user.FirmName = request.FirmName;
        if (request.BarNumber != null) user.BarNumber = request.BarNumber;
        if (request.Address != null) user.Address = request.Address;
        if (request.City != null) user.City = request.City;
        if (request.PostalCode != null) user.PostalCode = request.PostalCode;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Profil mis à jour pour {UserId}", userId);

        return Ok(new { message = "Profil mis à jour avec succès" });
    }

    /// <summary>
    /// Supprime le compte de l'utilisateur connecté (confirmation par mot de passe)
    /// </summary>
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

        if (!_passwordService.VerifyPassword(request.Password, user.Password))
            return Unauthorized(new { message = "Mot de passe incorrect" });

        var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId).ToListAsync();
        _db.RefreshTokens.RemoveRange(tokens);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Compte supprimé: {Email}", user.Email);
        return Ok(new { message = "Compte supprimé avec succès" });
    }
}

public record DeleteAccountRequest(string Password);
