using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Validators;
using MemoLib.Api.Authorization;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly JwtTokenService _jwtService;
    private readonly PasswordService _passwordService;
    private readonly ILogger<AuthController> _logger;
    private readonly MemoLibDbContext _dbContext;
    private readonly BruteForceProtectionService _bruteForceProtection;
    private readonly EmailValidationService _emailValidation;
    private readonly EmailVerificationService _emailVerification;

    public AuthController(
        JwtTokenService jwtService,
        PasswordService passwordService,
        ILogger<AuthController> logger,
        MemoLibDbContext dbContext,
        BruteForceProtectionService bruteForceProtection,
        EmailValidationService emailValidation,
        EmailVerificationService emailVerification)
    {
        _jwtService = jwtService;
        _passwordService = passwordService;
        _logger = logger;
        _dbContext = dbContext;
        _bruteForceProtection = bruteForceProtection;
        _emailValidation = emailValidation;
        _emailVerification = emailVerification;
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
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var emailForBrute = request.Email?.Trim().ToLowerInvariant();

        if (await _bruteForceProtection.IsLockedOutAsync(clientIp, emailForBrute))
        {
            return StatusCode(429, new { message = "Trop de tentatives. Réessayez dans quelques minutes.", retryAfterMinutes = 5 });
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            await _bruteForceProtection.RecordFailedAttemptAsync(clientIp, emailForBrute);
            return BadRequest(new { message = "Email et mot de passe requis" });
        }

        if (!_emailValidation.ValidateEmail(request.Email).IsValid)
        {
            await _bruteForceProtection.RecordFailedAttemptAsync(clientIp, emailForBrute);
            return BadRequest(new { message = "Format d'email invalide" });
        }

        var normalizedEmail = emailForBrute!;
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !_passwordService.VerifyPassword(request.Password, user.Password))
        {
            await _bruteForceProtection.RecordFailedAttemptAsync(clientIp, normalizedEmail);
            _logger.LogWarning("Tentative de connexion échouée pour: {Email} depuis {IP}", normalizedEmail, clientIp);
            return Unauthorized(new { message = "Identifiants invalides" });
        }

        if (!user.IsEmailVerified)
        {
            return StatusCode(403, new { message = "Veuillez confirmer votre adresse email avant de vous connecter.", code = "EMAIL_NOT_VERIFIED" });
        }

        await _bruteForceProtection.RecordSuccessfulLoginAsync(clientIp, normalizedEmail);
        var authToken = _jwtService.GenerateToken(user);

        // Stocker le refresh token en base pour révocation
        _dbContext.RefreshTokens.Add(new Models.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = authToken.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync();

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
    /// Rafraîchit un JWT token via un refresh token (avec révocation)
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token requis" });
        }

        // Vérifier que le token existe en base et est actif
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.IsExpired)
        {
            return Unauthorized(new { message = "Refresh token invalide ou révoqué" });
        }

        if (!_jwtService.TryValidateRefreshToken(request.RefreshToken, out var principal) || principal == null)
        {
            return Unauthorized(new { message = "Refresh token invalide" });
        }

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "Refresh token incomplet" });
        }

        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            return Unauthorized(new { message = "Refresh token invalide" });
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == parsedUserId && u.Email == normalizedEmail);

        if (user == null)
        {
            _logger.LogWarning("Refresh refusé: utilisateur introuvable pour {UserId}", parsedUserId);
            return Unauthorized(new { message = "Refresh token invalide" });
        }

        var authToken = _jwtService.GenerateToken(user);

        // Révoquer l'ancien token et stocker le nouveau
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.ReplacedByToken = authToken.RefreshToken;

        _dbContext.RefreshTokens.Add(new Models.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = authToken.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync();

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
    /// Déconnecte l'utilisateur en révoquant tous ses refresh tokens
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();

        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Logout: {Count} tokens révoqués pour {UserId}", activeTokens.Count, userId);
        return Ok(new { message = "Déconnecté avec succès" });
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
    /// Change le mot de passe (utilisateur authentifié)
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest(new { message = "Mot de passe actuel et nouveau requis" });
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Non authentifié" });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return NotFound(new { message = "Utilisateur introuvable" });
        }

        if (!_passwordService.VerifyPassword(request.CurrentPassword, user.Password))
        {
            _logger.LogWarning("Tentative de changement avec mauvais mot de passe pour: {UserId}", userId);
            await Task.Delay(2000);
            return Unauthorized(new { message = "Mot de passe actuel incorrect" });
        }

        user.Password = _passwordService.HashPassword(request.NewPassword);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Mot de passe changé pour: {UserId}", userId);
        return Ok(new { message = "Mot de passe changé avec succès" });
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

        if (!_emailValidation.ValidateEmail(request.Email).IsValid)
        {
            return BadRequest(new { message = "Format d'email invalide" });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == normalizedEmail);

        if (existingUser)
        {
            return Conflict(new { message = "Un compte existe déjà avec cet email" });
        }

        var hashedPasswordStr = _passwordService.HashPassword(request.Password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            Password = hashedPasswordStr,
            Name = request.Name,
            Role = Roles.Agent,
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

        _logger.LogInformation("Nouvel utilisateur inscrit: {Email}", user.Email);

        // Envoyer email de vérification
        var token = await _emailVerification.CreateVerificationTokenAsync(user.Id);
        var emailSent = await _emailVerification.SendVerificationEmailAsync(user.Email, token);

        return Ok(new RegisterResponse
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = Roles.Agent,
            Message = emailSent
                ? "Un email de confirmation a été envoyé. Vérifiez votre boîte de réception."
                : "Compte créé. SMTP non configuré — contactez l'administrateur pour activer votre compte."
        });
    }

    /// <summary>
    /// Confirme l'adresse email via le token reçu par mail — redirige vers page HTML
    /// </summary>
    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Redirect("/email-confirmed.html?status=error");

        var user = await _emailVerification.ConfirmEmailAsync(token);
        if (user == null)
            return Redirect("/email-confirmed.html?status=error");

        _logger.LogInformation("Email confirmé pour: {Email}", user.Email);
        return Redirect("/email-confirmed.html?status=ok");
    }

    /// <summary>
    /// Renvoie l'email de vérification
    /// </summary>
    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Email))
            return BadRequest(new { message = "Email requis" });

        await _emailVerification.ResendVerificationAsync(request.Email.Trim().ToLowerInvariant());

        // Toujours retourner OK pour ne pas révéler si l'email existe
        return Ok(new { message = "Si un compte non vérifié existe avec cet email, un nouveau lien a été envoyé." });
    }
}

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
