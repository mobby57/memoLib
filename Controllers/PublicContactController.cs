using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MimeKit;
using System.Security.Cryptography;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/public/contact")]
[AllowAnonymous]
public class PublicContactController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<PublicContactController> _logger;
    private readonly MemoLibDbContext _context;

    public PublicContactController(IConfiguration configuration, ILogger<PublicContactController> logger, MemoLibDbContext context)
    {
        _configuration = configuration;
        _logger = logger;
        _context = context;
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

            await TrySendOnboardingLinkAsync(
                request,
                smtp,
                fromEmail,
                request.NeedType,
                request.Timeline,
                request.ContactPref);

            await smtp.DisconnectAsync(true);

            _logger.LogInformation("Contact public envoyé avec succès.");

            return Ok(new { message = "Demande envoyée avec succès." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi contact public");
            return StatusCode(500, new { message = "Échec de l'envoi serveur. Réessayez ou utilisez l'envoi manuel." });
        }
    }

    private async Task TrySendOnboardingLinkAsync(
        PublicContactRequest request,
        SmtpClient smtp,
        string fromEmail,
        string? needType,
        string? timeline,
        string? contactPref)
    {
        var templateIdRaw = _configuration["Onboarding:AutoTemplateId"];
        if (!Guid.TryParse(templateIdRaw, out var templateId))
            return;

        var template = await _context.ClientOnboardingTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.IsActive);

        if (template == null)
            return;

        var token = GenerateToken();
        var now = DateTime.UtcNow;
        var onboarding = new ClientOnboardingRequest
        {
            Id = Guid.NewGuid(),
            TemplateId = templateId,
            OwnerUserId = template.UserId,
            ClientName = request.Name.Trim(),
            ClientEmail = request.Email.Trim(),
            AccessToken = token,
            Status = "PENDING",
            CreatedAt = now,
            ExpiresAt = now.AddDays(7),
            AnswersJson = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["context"] = request.Details,
                ["needType"] = needType ?? string.Empty,
                ["timeline"] = timeline ?? string.Empty,
                ["contactPreference"] = contactPref ?? string.Empty
            })
        };

        _context.ClientOnboardingRequests.Add(onboarding);
        await _context.SaveChangesAsync();

        var frontendBaseUrl = _configuration["Onboarding:FrontendBaseUrl"]
            ?? _configuration["PublicApp:BaseUrl"]
            ?? "http://localhost:5078";
        var link = $"{frontendBaseUrl.TrimEnd('/')}/onboarding.html?token={Uri.EscapeDataString(token)}";

        var onboardingMail = new MimeMessage();
        onboardingMail.From.Add(MailboxAddress.Parse(fromEmail));
        onboardingMail.To.Add(MailboxAddress.Parse(request.Email.Trim()));
        onboardingMail.Subject = "Votre formulaire d'inscription MemoLib";
        onboardingMail.Body = new TextPart("plain")
        {
            Text = string.Join('\n',
            [
                $"Bonjour {request.Name.Trim()},",
                "",
                "Merci pour votre demande.",
                "Pour démarrer, merci de compléter votre formulaire d'inscription intelligent :",
                link,
                "",
                "Vous pourrez indiquer les pièces à fournir et les participants du dossier.",
                "",
                "MemoLib"
            ])
        };

        await smtp.SendAsync(onboardingMail);
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[24];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
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
