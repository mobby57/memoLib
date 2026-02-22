using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;
using System.Security.Cryptography;
using System.Text;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityController : ControllerBase
{
    private readonly UrlValidationService _urlValidationService;
    private readonly ILogger<SecurityController> _logger;

    public SecurityController(UrlValidationService urlValidationService, ILogger<SecurityController> logger)
    {
        _urlValidationService = urlValidationService;
        _logger = logger;
    }

    [HttpGet("csrf-token")]
    public IActionResult GetCSRFToken()
    {
        var token = GenerateCSRFToken();
        HttpContext.Session.SetString("csrf_token", token);
        
        return Ok(new { token });
    }

    [HttpPost("validate-url")]
    public IActionResult ValidateUrl([FromBody] ValidateUrlRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest(new { message = "URL requise" });
        }

        var isValid = _urlValidationService.IsUrlSafe(request.Url);
        var sanitizedUrl = _urlValidationService.SanitizeUrl(request.Url);

        _logger.LogInformation("Validation URL: {Url} -> {IsValid}", request.Url, isValid);

        return Ok(new 
        { 
            isValid, 
            sanitizedUrl,
            message = isValid ? "URL sécurisée" : "URL bloquée pour sécurité"
        });
    }

    [HttpPost("validate-email")]
    public IActionResult ValidateEmail([FromBody] ValidateEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email requis" });
        }

        var isValid = _urlValidationService.IsEmailSafe(request.Email);
        
        _logger.LogInformation("Validation email: {Email} -> {IsValid}", request.Email, isValid);

        return Ok(new 
        { 
            isValid,
            message = isValid ? "Email valide" : "Format d'email invalide"
        });
    }

    [HttpPost("report-security-incident")]
    [Authorize]
    public IActionResult ReportSecurityIncident([FromBody] SecurityIncidentRequest request)
    {
        _logger.LogWarning("Incident de sécurité signalé: {Type} - {Description} - User: {UserId}", 
            request.Type, request.Description, User.Identity?.Name);

        // En production, vous pourriez vouloir stocker ceci dans une base de données
        // ou envoyer une alerte à votre équipe de sécurité

        return Ok(new { message = "Incident signalé avec succès" });
    }

    [HttpGet("security-headers")]
    public IActionResult GetSecurityHeaders()
    {
        var headers = new Dictionary<string, string>
        {
            ["X-Frame-Options"] = "DENY",
            ["X-Content-Type-Options"] = "nosniff",
            ["X-XSS-Protection"] = "1; mode=block",
            ["Referrer-Policy"] = "strict-origin-when-cross-origin",
            ["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
            ["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
        };

        return Ok(headers);
    }

    private static string GenerateCSRFToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}

public class ValidateUrlRequest
{
    public string Url { get; set; } = string.Empty;
}

public class ValidateEmailRequest
{
    public string Email { get; set; } = string.Empty;
}

public class SecurityIncidentRequest
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}