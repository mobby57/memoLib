using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Data;
using System.Net.Mail;
using System.Net;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailController : ControllerBase
{
    private readonly MemoLibDbContext _db;
    private readonly IConfiguration _config;

    public EmailController(MemoLibDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        
        // Validation des entrées
        if (string.IsNullOrWhiteSpace(req.To) || string.IsNullOrWhiteSpace(req.Subject) || string.IsNullOrWhiteSpace(req.Body))
            return BadRequest(new { message = "To, Subject et Body sont obligatoires" });
        
        // Validation email destinataire
        if (!System.Text.RegularExpressions.Regex.IsMatch(req.To, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return BadRequest(new { message = "Adresse email destinataire invalide" });
        
        // Protection injection SMTP
        if (req.To.Contains('\n') || req.To.Contains('\r') || req.Subject.Contains('\n') || req.Subject.Contains('\r'))
            return BadRequest(new { message = "Caractères interdits détectés" });
        
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
                Subject = req.Subject,
                Body = req.Body,
                IsBodyHtml = false
            };
            mail.To.Add(req.To);

            await client.SendMailAsync(mail);
            return Ok(new { message = "Email sent", to = req.To });
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Format d'email invalide" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur envoi email", error = ex.Message });
        }
    }

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest req)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var template = new Models.EmailTemplate
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = req.Name,
            Subject = req.Subject,
            Body = req.Body,
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

public record SendEmailRequest(string To, string Subject, string Body);
public record CreateTemplateRequest(string Name, string Subject, string Body);
