using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class EmailVerificationService
{
    private readonly MemoLibDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailVerificationService> _logger;

    public EmailVerificationService(MemoLibDbContext db, IConfiguration config, ILogger<EmailVerificationService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<string> CreateVerificationTokenAsync(Guid userId)
    {
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("/", "_").Replace("+", "-").TrimEnd('=');

        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        });
        await _db.SaveChangesAsync();

        return token;
    }

    public async Task<bool> SendVerificationEmailAsync(string toEmail, string token)
    {
        var appUrl = _config["AppUrl"] ?? "http://localhost:5078";
        var confirmUrl = $"{appUrl}/api/auth/confirm-email?token={token}";

        var smtpHost = _config["EmailMonitor:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPortRaw = _config["EmailMonitor:SmtpPort"] ?? "587";
        var username = _config["EmailMonitor:Username"];
        var password = _config["EmailMonitor:Password"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("SMTP non configuré — email de vérification non envoyé pour {Email}", toEmail);
            return false;
        }

        if (!int.TryParse(smtpPortRaw, out var smtpPort)) smtpPort = 587;

        try
        {
            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password)
            };

            using var mail = new MailMessage
            {
                From = new MailAddress(username, "MemoLib"),
                Subject = "Confirmez votre inscription MemoLib",
                Body = $"""
                    Bonjour,

                    Merci de votre inscription sur MemoLib.

                    Cliquez sur le lien ci-dessous pour confirmer votre adresse email :
                    {confirmUrl}

                    Ce lien expire dans 24 heures.

                    Cordialement,
                    L'équipe MemoLib
                    """,
                IsBodyHtml = false
            };
            mail.To.Add(toEmail);

            await client.SendMailAsync(mail);
            _logger.LogInformation("Email de vérification envoyé à {Email}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Échec envoi email de vérification à {Email}", toEmail);
            return false;
        }
    }

    public async Task<User?> ConfirmEmailAsync(string token)
    {
        var verification = await _db.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token);

        if (verification == null || verification.IsUsed || verification.IsExpired)
            return null;

        verification.ConfirmedAt = DateTime.UtcNow;
        verification.User.IsEmailVerified = true;
        await _db.SaveChangesAsync();

        return verification.User;
    }

    public async Task<string?> ResendVerificationAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsEmailVerified);
        if (user == null) return null;

        var token = await CreateVerificationTokenAsync(user.Id);
        await SendVerificationEmailAsync(email, token);
        return token;
    }
}
