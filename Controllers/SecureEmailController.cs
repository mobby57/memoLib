using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Data;
using MemoLib.Api.Services;
using System.Net.Mail;
using System.Net;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SecureEmailController : ControllerBase
{
    private readonly MemoLibDbContext _db;
    private readonly IConfiguration _config;
    private readonly EmailValidationService _emailValidation;
    private readonly ILogger<SecureEmailController> _logger;

    public SecureEmailController(MemoLibDbContext db, IConfiguration config, 
        EmailValidationService emailValidation, ILogger<SecureEmailController> logger)
    {
        _db = db;
        _config = config;
        _emailValidation = emailValidation;
        _logger = logger;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendEmail([FromBody] SecureSendEmailRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();

        // Validation sécurisée du destinataire
        var validation = _emailValidation.ValidateEmail(req.To);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Tentative d'envoi à email invalide: {Email} par {UserId}", req.To, userId);
            return BadRequest(new { message = validation.Message });
        }

        // Sanitisation du contenu
        var sanitizedSubject = _emailValidation.SanitizeEmailContent(req.Subject);
        var sanitizedBody = _emailValidation.SanitizeEmailContent(req.Body);

        var smtpHost = _config["EmailMonitor:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_config["EmailMonitor:SmtpPort"] ?? "587");
        var username = _config["EmailMonitor:Username"];
        var password = _config["EmailMonitor:Password"];

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            return BadRequest(new { message = "SMTP not configured" });

        try
        {
            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password)
            };

            var mail = new MailMessage
            {
                From = new MailAddress(username),
                Subject = sanitizedSubject,
                Body = sanitizedBody,
                IsBodyHtml = false
            };
            mail.To.Add(req.To);

            await client.SendMailAsync(mail);
            
            _logger.LogInformation("Email envoyé de {UserId} vers {To}", userId, req.To);
            return Ok(new { message = "Email sent", to = req.To });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi email de {UserId} vers {To}", userId, req.To);
            return StatusCode(500, new { message = "Erreur lors de l'envoi" });
        }
    }

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] SecureCreateTemplateRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        
        var template = new Models.EmailTemplate
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = _emailValidation.SanitizeEmailContent(req.Name),
            Subject = _emailValidation.SanitizeEmailContent(req.Subject),
            Body = _emailValidation.SanitizeEmailContent(req.Body),
            CreatedAt = DateTime.UtcNow
        };
        
        _db.EmailTemplates.Add(template);
        await _db.SaveChangesAsync();
        return Ok(template);
    }

    [HttpGet("templates")]
    public IActionResult ListTemplates()
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var templates = _db.EmailTemplates.Where(t => t.UserId == userId).ToList();
        return Ok(templates);
    }
}

public record SecureSendEmailRequest(string To, string Subject, string Body);
public record SecureCreateTemplateRequest(string Name, string Subject, string Body);