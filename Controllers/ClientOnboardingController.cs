using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MimeKit;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/onboarding")]
public class ClientOnboardingController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ClientOnboardingController> _logger;

    public ClientOnboardingController(
        MemoLibDbContext context,
        IConfiguration configuration,
        ILogger<ClientOnboardingController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("templates")]
    [Authorize]
    public async Task<IActionResult> GetTemplates()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var templates = await _context.ClientOnboardingTemplates
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        var result = templates.Select(ToTemplateView);
        return Ok(result);
    }

    [HttpPost("templates")]
    [Authorize]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateOnboardingTemplateRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Le nom du formulaire est obligatoire." });

        var now = DateTime.UtcNow;
        var template = new ClientOnboardingTemplate
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            NeedOptionsJson = SerializeSafe(request.NeedOptions),
            RequiredDocumentsJson = SerializeSafe(request.RequiredDocuments),
            ParticipantRolesJson = SerializeSafe(request.ParticipantRoles),
            ExtraFieldsJson = SerializeSafe(request.ExtraFields),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.ClientOnboardingTemplates.Add(template);
        await _context.SaveChangesAsync();

        return Ok(ToTemplateView(template));
    }

    [HttpPost("templates/{templateId:guid}/invite")]
    [Authorize]
    public async Task<IActionResult> InviteClient(Guid templateId, [FromBody] InviteClientRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var template = await _context.ClientOnboardingTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.UserId == userId && t.IsActive);

        if (template == null)
            return NotFound(new { message = "Formulaire introuvable." });

        if (string.IsNullOrWhiteSpace(request.ClientEmail) || string.IsNullOrWhiteSpace(request.ClientName))
            return BadRequest(new { message = "Nom et email client sont obligatoires." });

        var token = GenerateToken();
        var now = DateTime.UtcNow;
        var expiresAt = now.AddDays(Math.Clamp(request.ExpiresInDays ?? 7, 1, 30));

        var onboarding = new ClientOnboardingRequest
        {
            Id = Guid.NewGuid(),
            TemplateId = templateId,
            OwnerUserId = userId,
            ClientName = request.ClientName.Trim(),
            ClientEmail = request.ClientEmail.Trim(),
            AccessToken = token,
            Status = "PENDING",
            CreatedAt = now,
            ExpiresAt = expiresAt
        };

        _context.ClientOnboardingRequests.Add(onboarding);
        await _context.SaveChangesAsync();

        var frontendBaseUrl = _configuration["Onboarding:FrontendBaseUrl"]
            ?? _configuration["PublicApp:BaseUrl"]
            ?? "http://localhost:5078";
        var link = $"{frontendBaseUrl.TrimEnd('/')}/onboarding.html?token={Uri.EscapeDataString(token)}";

        if (request.SendEmail ?? true)
        {
            await SendOnboardingEmailSafeAsync(request.ClientEmail.Trim(), request.ClientName.Trim(), link, template.Name);
        }

        return Ok(new
        {
            onboarding.Id,
            onboarding.ClientName,
            onboarding.ClientEmail,
            onboarding.Status,
            onboarding.ExpiresAt,
            Link = link
        });
    }

    [HttpGet("requests")]
    [Authorize]
    public async Task<IActionResult> GetRequests()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var rows = await _context.ClientOnboardingRequests
            .Where(r => r.OwnerUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(200)
            .ToListAsync();

        return Ok(rows.Select(r => new
        {
            r.Id,
            r.TemplateId,
            r.ClientName,
            r.ClientEmail,
            r.Status,
            r.CreatedAt,
            r.ExpiresAt,
            r.SubmittedAt,
            r.SelectedNeed,
            r.CreatedCaseId
        }));
    }

    [HttpGet("public/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicForm(string token)
    {
        var request = await _context.ClientOnboardingRequests
            .FirstOrDefaultAsync(r => r.AccessToken == token);

        if (request == null)
            return NotFound(new { message = "Lien invalide." });

        if (request.ExpiresAt < DateTime.UtcNow || request.Status == "EXPIRED")
            return BadRequest(new { message = "Lien expiré." });

        var template = await _context.ClientOnboardingTemplates
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && t.IsActive);

        if (template == null)
            return NotFound(new { message = "Formulaire introuvable." });

        return Ok(new
        {
            request.ClientName,
            request.ClientEmail,
            request.ExpiresAt,
            Template = ToTemplateView(template)
        });
    }

    [HttpPost("public/{token}/submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitPublicForm(string token, [FromBody] SubmitOnboardingRequest request)
    {
        var onboarding = await _context.ClientOnboardingRequests
            .FirstOrDefaultAsync(r => r.AccessToken == token);

        if (onboarding == null)
            return NotFound(new { message = "Lien invalide." });

        if (onboarding.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "Lien expiré." });

        if (onboarding.Status == "SUBMITTED")
            return Conflict(new { message = "Formulaire déjà soumis." });

        var template = await _context.ClientOnboardingTemplates
            .FirstOrDefaultAsync(t => t.Id == onboarding.TemplateId && t.IsActive);

        if (template == null)
            return NotFound(new { message = "Formulaire introuvable." });

        var selectedNeed = (request.SelectedNeed ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(selectedNeed))
            return BadRequest(new { message = "Le besoin principal est obligatoire." });

        var ownerId = onboarding.OwnerUserId;
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == ownerId && c.Email.ToLower() == onboarding.ClientEmail.ToLower());

        if (client == null)
        {
            client = new Client
            {
                Id = Guid.NewGuid(),
                UserId = ownerId,
                Name = onboarding.ClientName,
                Email = onboarding.ClientEmail,
                PhoneNumber = request.Phone,
                CreatedAt = DateTime.UtcNow
            };
            _context.Clients.Add(client);
        }

        var caseEntity = new Case
        {
            Id = Guid.NewGuid(),
            UserId = ownerId,
            ClientId = client.Id,
            Title = $"{selectedNeed} - {onboarding.ClientName}",
            Tags = $"onboarding,{selectedNeed.ToLowerInvariant().Replace(' ', '-')}",
            Status = "OPEN",
            Priority = 1,
            CreatedAt = DateTime.UtcNow
        };
        _context.Cases.Add(caseEntity);

        var participants = request.Participants ?? new List<OnboardingParticipant>();
        foreach (var participant in participants)
        {
            if (string.IsNullOrWhiteSpace(participant.Email))
                continue;

            var share = new CaseShare
            {
                Id = Guid.NewGuid(),
                CaseId = caseEntity.Id,
                SharedWithEmail = participant.Email.Trim(),
                SharedWithName = string.IsNullOrWhiteSpace(participant.Name)
                    ? participant.Email.Trim()
                    : participant.Name.Trim(),
                Role = string.IsNullOrWhiteSpace(participant.Role) ? "COLLABORATOR" : participant.Role.Trim().ToUpperInvariant(),
                SharedAt = DateTime.UtcNow,
                SharedByUserId = ownerId
            };

            _context.CaseShares.Add(share);
        }

        onboarding.SelectedNeed = selectedNeed;
        onboarding.ParticipantsJson = SerializeSafe(participants);
        onboarding.ProvidedDocumentsJson = SerializeSafe(request.ProvidedDocuments);
        onboarding.AnswersJson = SerializeDictionarySafe(request.Answers);
        onboarding.SubmittedAt = DateTime.UtcNow;
        onboarding.Status = "SUBMITTED";
        onboarding.CreatedCaseId = caseEntity.Id;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = ownerId,
            Action = "ClientOnboardingSubmitted",
            Metadata = $"onboardingRequestId={onboarding.Id};caseId={caseEntity.Id};need={selectedNeed}",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Message = "Inscription enregistrée. Espace partagé créé.",
            CaseId = caseEntity.Id,
            ParticipantsAdded = participants.Count(p => !string.IsNullOrWhiteSpace(p.Email))
        });
    }

    private async Task SendOnboardingEmailSafeAsync(string email, string name, string link, string templateName)
    {
        var toEmail = email;
        var fromEmail = _configuration["PublicContact:FromEmail"]
            ?? _configuration["EmailMonitor:Username"];
        var smtpHost = _configuration["PublicContact:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = _configuration.GetValue<int?>("PublicContact:SmtpPort") ?? 587;
        var smtpUsername = _configuration["PublicContact:SmtpUsername"]
            ?? _configuration["EmailMonitor:Username"]
            ?? fromEmail;
        var smtpPassword = _configuration["PublicContact:SmtpPassword"]
            ?? _configuration["EmailMonitor:Password"];
        var useSslOnConnect = _configuration.GetValue<bool?>("PublicContact:UseSslOnConnect") ?? false;

        if (string.IsNullOrWhiteSpace(fromEmail) || string.IsNullOrWhiteSpace(smtpPassword))
        {
            _logger.LogWarning("Email onboarding non envoyé: configuration SMTP incomplète.");
            return;
        }

        var body = string.Join('\n',
        [
            $"Bonjour {name},",
            "",
            "Merci pour votre contact.",
            "Veuillez compléter votre formulaire d'inscription intelligent pour lancer votre dossier:",
            link,
            "",
            $"Formulaire: {templateName}",
            "",
            "Ce lien est personnel et temporaire.",
            "",
            "MemoLib"
        ]);

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Votre formulaire d'inscription MemoLib";
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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi email onboarding vers {Email}", email);
        }
    }

    private static object ToTemplateView(ClientOnboardingTemplate t)
    {
        return new
        {
            t.Id,
            t.Name,
            t.Description,
            NeedOptions = DeserializeList(t.NeedOptionsJson),
            RequiredDocuments = DeserializeList(t.RequiredDocumentsJson),
            ParticipantRoles = DeserializeList(t.ParticipantRolesJson),
            ExtraFields = DeserializeExtraFields(t.ExtraFieldsJson),
            t.IsActive,
            t.CreatedAt,
            t.UpdatedAt
        };
    }

    private static string SerializeSafe<T>(T? value)
    {
        return JsonSerializer.Serialize(value ?? Activator.CreateInstance<T>()!);
    }

    private static string SerializeDictionarySafe(Dictionary<string, string>? value)
    {
        return JsonSerializer.Serialize(value ?? new Dictionary<string, string>());
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[24];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static List<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<string>();
        return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
    }

    private static List<OnboardingExtraField> DeserializeExtraFields(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<OnboardingExtraField>();
        return JsonSerializer.Deserialize<List<OnboardingExtraField>>(json) ?? new List<OnboardingExtraField>();
    }
}

public class CreateOnboardingTemplateRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public List<string> NeedOptions { get; set; } = new();
    public List<string> RequiredDocuments { get; set; } = new();
    public List<string> ParticipantRoles { get; set; } = new() { "CLIENT", "AVOCAT", "SECRÉTAIRE", "JUGE" };
    public List<OnboardingExtraField> ExtraFields { get; set; } = new();
}

public class OnboardingExtraField
{
    public string Key { get; set; } = null!;
    public string Label { get; set; } = null!;
    public bool Required { get; set; }
    public string Type { get; set; } = "TEXT";
    public List<string>? Options { get; set; }
}

public class InviteClientRequest
{
    public string ClientName { get; set; } = null!;
    public string ClientEmail { get; set; } = null!;
    public int? ExpiresInDays { get; set; }
    public bool? SendEmail { get; set; } = true;
}

public class SubmitOnboardingRequest
{
    public string SelectedNeed { get; set; } = null!;
    public string? Phone { get; set; }
    public Dictionary<string, string> Answers { get; set; } = new();
    public List<string> ProvidedDocuments { get; set; } = new();
    public List<OnboardingParticipant> Participants { get; set; } = new();
}

public class OnboardingParticipant
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = "COLLABORATOR";
}