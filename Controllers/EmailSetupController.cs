using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailSetupController : ControllerBase
{
    private readonly MemoLibDbContext _dbContext;
    private readonly ILogger<EmailSetupController> _logger;

    public EmailSetupController(MemoLibDbContext dbContext, ILogger<EmailSetupController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpPost("configure")]
    public async Task<IActionResult> ConfigureEmail([FromBody] EmailConfigRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        
        // Validation simple
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "Format d'email invalide" });

        if (string.IsNullOrWhiteSpace(request.AppPassword))
            return BadRequest(new { message = "Mot de passe d'application requis" });

        // Détection automatique du provider
        var provider = DetectEmailProvider(request.Email);
        
        // Test de connexion
        var testResult = await TestEmailConnection(request.Email, request.AppPassword, provider);
        if (!testResult.Success)
            return BadRequest(new { message = testResult.Error });

        // Sauvegarde sécurisée
        await SaveUserEmailConfig(userId, request.Email, request.AppPassword, provider);

        return Ok(new { 
            message = "Configuration email réussie",
            provider = provider.Name,
            imapHost = provider.ImapHost,
            smtpHost = provider.SmtpHost
        });
    }

    [HttpGet("providers")]
    public IActionResult GetSupportedProviders()
    {
        return Ok(new[]
        {
            new { name = "Gmail", domain = "gmail.com", instructions = "Activez la validation en 2 étapes puis créez un mot de passe d'application" },
            new { name = "Outlook", domain = "outlook.com", instructions = "Utilisez votre mot de passe habituel" },
            new { name = "Yahoo", domain = "yahoo.com", instructions = "Créez un mot de passe d'application dans les paramètres" }
        });
    }

    [HttpGet("guide/{provider}")]
    public IActionResult GetSetupGuide(string provider)
    {
        var guides = new Dictionary<string, object>
        {
            ["gmail"] = new
            {
                steps = new[]
                {
                    "1. Allez sur myaccount.google.com",
                    "2. Cliquez sur 'Sécurité'",
                    "3. Activez la 'Validation en 2 étapes'",
                    "4. Allez dans 'Mots de passe des applications'",
                    "5. Créez un mot de passe pour 'MemoLib'",
                    "6. Copiez le mot de passe généré"
                },
                video = "https://support.google.com/accounts/answer/185833"
            },
            ["outlook"] = new
            {
                steps = new[]
                {
                    "1. Utilisez votre email Outlook habituel",
                    "2. Utilisez votre mot de passe habituel",
                    "3. Pas de configuration spéciale requise"
                }
            }
        };

        return Ok(guides.GetValueOrDefault(provider.ToLower(), new { error = "Provider non supporté" }));
    }

    private bool IsValidEmail(string email) => 
        !string.IsNullOrWhiteSpace(email) && email.Contains("@") && email.Contains(".");

    private EmailProvider DetectEmailProvider(string email)
    {
        var domain = email.Split('@')[1].ToLowerInvariant();
        
        return domain switch
        {
            "gmail.com" => new EmailProvider("Gmail", "imap.gmail.com", 993, "smtp.gmail.com", 587),
            "outlook.com" or "hotmail.com" => new EmailProvider("Outlook", "outlook.office365.com", 993, "smtp-mail.outlook.com", 587),
            "yahoo.com" => new EmailProvider("Yahoo", "imap.mail.yahoo.com", 993, "smtp.mail.yahoo.com", 587),
            _ => new EmailProvider("Generic", "imap." + domain, 993, "smtp." + domain, 587)
        };
    }

    private async Task<TestResult> TestEmailConnection(string email, string password, EmailProvider provider)
    {
        try
        {
            // Test IMAP simple
            using var client = new MailKit.Net.Imap.ImapClient();
            await client.ConnectAsync(provider.ImapHost, provider.ImapPort, true);
            await client.AuthenticateAsync(email, password);
            await client.DisconnectAsync(true);
            
            return new TestResult { Success = true };
        }
        catch (Exception ex)
        {
            return new TestResult { Success = false, Error = "Impossible de se connecter. Vérifiez vos identifiants." };
        }
    }

    private async Task SaveUserEmailConfig(Guid userId, string email, string password, EmailProvider provider)
    {
        var config = await _dbContext.UserEmailConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        
        if (config == null)
        {
            config = new UserEmailConfig { UserId = userId };
            _dbContext.UserEmailConfigs.Add(config);
        }

        config.Email = email;
        config.EncryptedPassword = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(password)); // Simple encoding
        config.ImapHost = provider.ImapHost;
        config.ImapPort = provider.ImapPort;
        config.SmtpHost = provider.SmtpHost;
        config.SmtpPort = provider.SmtpPort;
        config.IsEnabled = true;
        config.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
    }
}

public record EmailConfigRequest(string Email, string AppPassword);
public record EmailProvider(string Name, string ImapHost, int ImapPort, string SmtpHost, int SmtpPort);
public record TestResult { public bool Success { get; init; } public string Error { get; init; } = ""; }