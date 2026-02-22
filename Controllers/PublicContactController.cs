using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MimeKit;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/public/contact")]
[AllowAnonymous]
public class PublicContactController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<PublicContactController> _logger;

    public PublicContactController(IConfiguration configuration, ILogger<PublicContactController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] PublicContactRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Demande invalide." });

        var name = (request.Name ?? string.Empty).Trim();
        var email = (request.Email ?? string.Empty).Trim();
        var details = (request.Details ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(details))
            return BadRequest(new { message = "Nom, email et description sont obligatoires." });

        if (details.Length < 15)
            return BadRequest(new { message = "Merci d'ajouter plus de contexte (minimum 15 caractères)." });

        var toEmail = _configuration["PublicContact:ToEmail"]
            ?? _configuration["EmailMonitor:Username"];

        var fromEmail = _configuration["PublicContact:FromEmail"]
            ?? _configuration["EmailMonitor:Username"]
            ?? toEmail;

        var smtpHost = _configuration["PublicContact:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = _configuration.GetValue<int?>("PublicContact:SmtpPort") ?? 587;
        var smtpUsername = _configuration["PublicContact:SmtpUsername"]
            ?? _configuration["EmailMonitor:Username"]
            ?? fromEmail;
        var smtpPassword = _configuration["PublicContact:SmtpPassword"]
            ?? _configuration["EmailMonitor:Password"];
        var useSslOnConnect = _configuration.GetValue<bool?>("PublicContact:UseSslOnConnect") ?? false;

        if (string.IsNullOrWhiteSpace(toEmail) || string.IsNullOrWhiteSpace(fromEmail))
            return StatusCode(503, new { message = "Configuration email incomplète (from/to)." });

        if (string.IsNullOrWhiteSpace(smtpPassword))
            return StatusCode(503, new { message = "Configuration SMTP incomplète (mot de passe manquant)." });

        var subject = $"[MemoLib] Demande schéma data - {(string.IsNullOrWhiteSpace(request.Company) ? name : request.Company)}";
        var body = string.Join('\n',
        [
            "Bonjour,",
            "",
            "Nouvelle demande de contact depuis la page publique.",
            "",
            $"Nom: {name}",
            $"Email: {email}",
            $"Organisation: {request.Company}",
            $"Type de besoin: {request.NeedType}",
            $"Délai souhaité: {request.Timeline}",
            $"Préférence de contact: {request.ContactPref}",
            "",
            "Contexte / données à structurer:",
            details,
            "",
            "---",
            "Message envoyé automatiquement depuis MemoLib (contact public)."
        ]);

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.ReplyTo.Add(MailboxAddress.Parse(email));
        message.Body = new TextPart("plain") { Text = body };

        try
        {
            using var smtp = new SmtpClient();
            var secureOption = useSslOnConnect
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTlsWhenAvailable;

            await smtp.ConnectAsync(smtpHost, smtpPort, secureOption);

            if (!string.IsNullOrWhiteSpace(smtpUsername))
                await smtp.AuthenticateAsync(smtpUsername, smtpPassword);

            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);

            _logger.LogInformation("Contact public envoyé: from={From} to={To}", email, toEmail);

            return Ok(new { message = "Demande envoyée avec succès." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi contact public");
            return StatusCode(500, new { message = "Échec de l'envoi serveur. Réessayez ou utilisez l'envoi manuel." });
        }
    }
}

public record PublicContactRequest(
    string Name,
    string Email,
    string? Company,
    string? NeedType,
    string Details,
    string? Timeline,
    string? ContactPref
);
