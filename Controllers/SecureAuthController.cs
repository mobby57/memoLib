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
public class SecureAuthController : ControllerBase
{
    private readonly JwtTokenService _jwtService;
    private readonly PasswordService _passwordService;
    private readonly BruteForceProtectionService _bruteForceService;
    private readonly EmailValidationService _emailValidationService;
    private readonly PasswordResetService _passwordResetService;
    private readonly ILogger<SecureAuthController> _logger;
    private readonly MemoLibDbContext _dbContext;

    public SecureAuthController(
        JwtTokenService jwtService,
        PasswordService passwordService,
        BruteForceProtectionService bruteForceService,
        EmailValidationService emailValidationService,
        PasswordResetService passwordResetService,
        ILogger<SecureAuthController> logger,
        MemoLibDbContext dbContext)
    {
        _jwtService = jwtService;
        _passwordService = passwordService;
        _bruteForceService = bruteForceService;
        _emailValidationService = emailValidationService;
        _passwordResetService = passwordResetService;
        _logger = logger;
        _dbContext = dbContext;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email et mot de passe requis" });
        }

        // Validation de l'email
        var emailValidation = _emailValidationService.ValidateEmail(request.Email);
        if (!emailValidation.IsValid)
        {
            return BadRequest(new { message = emailValidation.Message });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var identifier = $"{normalizedEmail}_{clientIp}";

        // Vérifier le verrouillage
        if (await _bruteForceService.IsLockedOutAsync(identifier))
        {
            return StatusCode(429, new { message = "Compte temporairement verrouillé. Réessayez plus tard." });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !_passwordService.VerifyPassword(request.Password, user.Password))
        {
            _logger.LogWarning("Tentative de connexion échouée pour: {Email} depuis {IP}", normalizedEmail, clientIp);
            
            // Enregistrer l'échec et appliquer le délai
            await _bruteForceService.RecordFailedAttemptAsync(identifier);
            var delay = await _bruteForceService.GetDelayForFailedAttemptAsync(identifier);
            await Task.Delay(delay);
            
            return Unauthorized(new { message = "Identifiants invalides" });
        }

        // Connexion réussie
        await _bruteForceService.RecordSuccessfulLoginAsync(identifier);
        
        var authToken = _jwtService.GenerateToken(user);

        var response = new LoginResponse
        {
            Token = authToken.AccessToken,
            RefreshToken = authToken.RefreshToken,
            ExpiresAt = authToken.ExpiresAt,
            User = MapToUserDto(user)
        };

        _logger.LogInformation("Connexion réussie pour: {Email} depuis {IP}", user.Email, clientIp);
        return Ok(response);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var validation = RegisterRequestValidator.Validate(request.Email, request.Password, request.Name);
        if (!validation.IsValid)
            return BadRequest(new { message = validation.Error });

        // Validation avancée de l'email
        var emailValidation = _emailValidationService.ValidateEmail(request.Email);
        if (!emailValidation.IsValid)
            return BadRequest(new { message = emailValidation.Message });

        if (emailValidation.IsSuspicious)
        {
            _logger.LogWarning("Inscription avec email suspect: {Email} - {Message}", request.Email, emailValidation.Message);
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

    [HttpPost("request-password-reset")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email requis" });
        }

        var emailValidation = _emailValidationService.ValidateEmail(request.Email);
        if (!emailValidation.IsValid)
        {
            return BadRequest(new { message = emailValidation.Message });
        }

        // Générer le token (même si l'utilisateur n'existe pas pour éviter l'énumération)
        var token = await _passwordResetService.GenerateResetTokenAsync(request.Email);

        // TODO: Envoyer l'email avec le token
        // En production, vous devriez envoyer un email avec le lien de reset
        
        // Toujours retourner succès pour éviter l'énumération d'utilisateurs
        return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Token et nouveau mot de passe requis" });
        }

        var success = await _passwordResetService.ValidateAndResetPasswordAsync(request.Token, request.NewPassword);
        
        if (!success)
        {
            return BadRequest(new { message = "Token invalide ou expiré" });
        }

        return Ok(new { message = "Mot de passe réinitialisé avec succès" });
    }

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

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(new { message = "Refresh token requis" });
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

        var response = new RefreshResponse
        {
            Token = authToken.AccessToken,
            RefreshToken = authToken.RefreshToken,
            ExpiresAt = authToken.ExpiresAt,
            User = MapToUserDto(user)
        };

        return Ok(response);
    }

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

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        CreatedAt = user.CreatedAt
    };
}

public record RequestPasswordResetRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);