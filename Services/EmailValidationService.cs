using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Net;

namespace MemoLib.Api.Services;

public class EmailValidationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailValidationService> _logger;

    public EmailValidationService(IConfiguration configuration, ILogger<EmailValidationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private static readonly HashSet<string> SuspiciousDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "tempmail.org", "10minutemail.com", "guerrillamail.com", "mailinator.com",
        "yopmail.com", "temp-mail.org", "throwaway.email", "maildrop.cc"
    };

    private static readonly Regex EmailHeaderInjectionPattern = new(
        @"[\r\n]|(bcc|cc|to|from|subject):",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex ValidEmailPattern = new(
        @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        RegexOptions.Compiled
    );

    public ValidationResult ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return ValidationResult.Invalid("Email requis");

        email = email.Trim();

        if (email.Length > 254)
            return ValidationResult.Invalid("Email trop long");

        // Vérification basique du format
        if (!ValidEmailPattern.IsMatch(email))
            return ValidationResult.Invalid("Format d'email invalide");

        // Vérification avec MailAddress pour validation plus stricte
        try
        {
            var mailAddress = new MailAddress(email);
            if (mailAddress.Address != email)
                return ValidationResult.Invalid("Format d'email invalide");
        }
        catch
        {
            return ValidationResult.Invalid("Format d'email invalide");
        }

        // Vérification d'injection d'en-têtes
        if (EmailHeaderInjectionPattern.IsMatch(email))
            return ValidationResult.Invalid("Email contient des caractères interdits");

        // Vérification des domaines suspects
        var domain = email.Split('@')[1].ToLowerInvariant();
        if (SuspiciousDomains.Contains(domain))
            return ValidationResult.Suspicious("Domaine d'email temporaire détecté");

        return ValidationResult.Valid();
    }

    public string SanitizeEmailContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;

        // Supprimer les caractères de contrôle dangereux
        content = Regex.Replace(content, @"[\r\n\t]", " ");
        
        // Limiter la longueur
        if (content.Length > 10000)
            content = content.Substring(0, 10000);

        // Supprimer les séquences d'injection d'en-têtes
        content = EmailHeaderInjectionPattern.Replace(content, "");

        return content.Trim();
    }

    public bool IsValidRecipient(string email, List<string>? allowedDomains = null)
    {
        var validation = ValidateEmail(email);
        if (!validation.IsValid)
            return false;

        if (allowedDomains?.Any() == true)
        {
            var domain = email.Split('@')[1].ToLowerInvariant();
            return allowedDomains.Any(allowed => 
                domain.Equals(allowed, StringComparison.OrdinalIgnoreCase) ||
                domain.EndsWith($".{allowed}", StringComparison.OrdinalIgnoreCase));
        }

        return true;
    }

    public async Task<bool> SendUrgentEmailAsync(string to, string subject, string body)
    {
        if (!IsValidRecipient(to))
            return false;

        var sanitizedSubject = SanitizeEmailContent(subject);
        var sanitizedBody = SanitizeEmailContent(body);

        if (string.IsNullOrWhiteSpace(sanitizedSubject) || string.IsNullOrWhiteSpace(sanitizedBody))
            return false;

        var smtpHost = _configuration["EmailMonitor:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPortRaw = _configuration["EmailMonitor:SmtpPort"] ?? "587";
        var username = _configuration["EmailMonitor:Username"];
        var password = _configuration["EmailMonitor:Password"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("SMTP non configuré pour envoi urgent");
            return false;
        }

        if (!int.TryParse(smtpPortRaw, out var smtpPort))
            smtpPort = 587;

        try
        {
            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password)
            };

            using var mail = new MailMessage
            {
                From = new MailAddress(username),
                Subject = $"[URGENT] {sanitizedSubject}",
                Body = sanitizedBody,
                IsBodyHtml = false
            };

            mail.To.Add(to);
            await client.SendMailAsync(mail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Echec envoi email urgent");
            return false;
        }
    }
}

public class ValidationResult
{
    public bool IsValid { get; private set; }
    public bool IsSuspicious { get; private set; }
    public string Message { get; private set; } = string.Empty;

    private ValidationResult() { }

    public static ValidationResult Valid() => new() { IsValid = true };
    
    public static ValidationResult Invalid(string message) => new() 
    { 
        IsValid = false, 
        Message = message 
    };
    
    public static ValidationResult Suspicious(string message) => new() 
    { 
        IsValid = true, 
        IsSuspicious = true, 
        Message = message 
    };
}