using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Validators;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly JwtTokenService _jwtService;
    private readonly PasswordService _passwordService;
    private readonly ILogger<AuthController> _logger;
    private readonly MemoLibDbContext _dbContext;

    public AuthController(
        JwtTokenService jwtService,
        PasswordService passwordService,
        ILogger<AuthController> logger,
        MemoLibDbContext dbContext)
    {
        _jwtService = jwtService;
        _passwordService = passwordService;
        _logger = logger;
        _dbContext = dbContext;
    }

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        CreatedAt = user.CreatedAt
    };

    /// <summary>
    /// Connecte un utilisateur et retourne un JWT token
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Email et mot de passe requis" });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !_passwordService.VerifyPassword(request.Password, user.Password))
        {
            _logger.LogWarning("Tentative de connexion échouée pour: {Email}", normalizedEmail);
            return Unauthorized(new { message = "Identifiants invalides" });
        }

        var authToken = _jwtService.GenerateToken(user);

        var response = new LoginResponse
        {
            Token = authToken.AccessToken,
            RefreshToken = authToken.RefreshToken,
            ExpiresAt = authToken.ExpiresAt,
            User = MapToUserDto(user)
        };

        _logger.LogInformation("Connexion réussie pour: {Email}", user.Email);

        return Ok(response);
    }

    /// <summary>
    /// Valide un JWT token
    /// </summary>
    [HttpPost("validate")]
    public IActionResult ValidateToken([FromBody] string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new { isValid = false, message = "Token requis" });
        }

        var isValid = _jwtService.ValidateToken(token, "access");
        return Ok(new { isValid, message = isValid ? "Token valide" : "Token invalide" });
    }

    /// <summary>
    /// Rafraîchit un JWT token via un refresh token
    /// </summary>
    [HttpPost("refresh")]
    public IActionResult RefreshToken([FromBody] RefreshRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token requis" });
        }

        if (!_jwtService.TryValidateRefreshToken(request.RefreshToken, out var principal) || principal == null)
        {
            return Unauthorized(new { message = "Refresh token invalide" });
        }

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        var createdAtValue = principal.FindFirst("createdAt")?.Value;

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "Refresh token incomplet" });
        }

        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            return Unauthorized(new { message = "Refresh token invalide" });
        }

        var createdAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(createdAtValue) && DateTime.TryParse(createdAtValue, out var parsedDate))
        {
            createdAt = parsedDate;
        }

        var user = new User
        {
            Id = parsedUserId,
            Email = email,
            CreatedAt = createdAt
        };

        var authToken = _jwtService.GenerateToken(user);

        var response = new RefreshResponse
        {
            Token = authToken.AccessToken,
            RefreshToken = authToken.RefreshToken,
            ExpiresAt = authToken.ExpiresAt,
            User = MapToUserDto(user)
        };

        return Ok(response);
    }

    /// <summary>
    /// Teste l'accès authentifié (exemple)
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var emailClaim = User.FindFirst(ClaimTypes.Email);
        if (emailClaim == null)
        {
            return Unauthorized(new { message = "Non authentifié" });
        }

        return Ok(new
        {
            email = emailClaim.Value,
            id = User.FindFirst("userId")?.Value
        });
    }

    /// <summary>
    /// Enregistre un nouvel utilisateur (avocat)
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var validation = RegisterRequestValidator.Validate(request.Email, request.Password, request.Name);
        if (!validation.IsValid)
            return BadRequest(new { message = validation.Error });

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == normalizedEmail);

        if (existingUser)
        {
            return Conflict(new { message = "Un compte existe déjà avec cet email" });
        }

        // Hash du mot de passe simple (à remplacer par un algorithme dédié en production)
        var hashedPasswordStr = _passwordService.HashPassword(request.Password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            Password = hashedPasswordStr,
            Name = request.Name,
            Role = request.Role ?? "AVOCAT",
            Phone = request.Phone,
            FirmName = request.FirmName,
            BarNumber = request.BarNumber,
            Address = request.Address,
            City = request.City,
            PostalCode = request.PostalCode,
            Plan = request.Plan ?? "CABINET",
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(user);
        _dbContext.Sources.Add(new Source
        {
            Id = Guid.NewGuid(),
            Type = "email",
            UserId = user.Id
        });
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Nouvel utilisateur inscrit: {Email}", request.Email);

        return Ok(new RegisterResponse
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role ?? "AVOCAT"
        });
    }
}
