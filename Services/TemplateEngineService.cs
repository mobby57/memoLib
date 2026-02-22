using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class TemplateEngineService
{
    private readonly MemoLibDbContext _context;

    public TemplateEngineService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateResponseAsync(string clientContext, string subject, string caseType = "general")
    {
        var template = await GetTemplateAsync(caseType, subject);
        return PersonalizeTemplate(template, clientContext, subject);
    }

    private async Task<EmailTemplate> GetTemplateAsync(string caseType, string subject)
    {
        var normalizedCaseType = (caseType ?? string.Empty).Trim().ToLowerInvariant();
        var template = await _context.EmailTemplates
            .Where(t => t.Name.ToLower().Contains(normalizedCaseType))
            .FirstOrDefaultAsync();

        if (template != null) return template;

        // Template par défaut basé sur le sujet
        if (subject.ToLower().Contains("divorce"))
            return CreateDefaultTemplate("divorce", "Accusé de réception - Dossier divorce");
        
        if (subject.ToLower().Contains("travail"))
            return CreateDefaultTemplate("travail", "Accusé de réception - Droit du travail");

        return CreateDefaultTemplate("general", "Accusé de réception");
    }

    private EmailTemplate CreateDefaultTemplate(string category, string name)
    {
        var templates = new Dictionary<string, string>
        {
            ["divorce"] = @"Madame, Monsieur,

J'accuse réception de votre demande concernant votre dossier de divorce.

Votre dossier a été enregistré sous la référence {CASE_ID} et sera traité dans les meilleurs délais.

Je vous recontacterai prochainement pour fixer un rendez-vous afin d'étudier votre situation en détail.

Cordialement,
{LAWYER_NAME}",

            ["travail"] = @"Madame, Monsieur,

J'accuse réception de votre demande concernant votre situation professionnelle.

Votre dossier {CASE_ID} est désormais ouvert et fera l'objet d'une analyse approfondie.

Je vous contacterai rapidement pour organiser un entretien et examiner les pièces de votre dossier.

Cordialement,
{LAWYER_NAME}",

            ["general"] = @"Madame, Monsieur,

J'accuse réception de votre message du {EMAIL_DATE}.

Votre demande a été enregistrée sous la référence {CASE_ID} et sera traitée avec toute l'attention qu'elle mérite.

Je reviendrai vers vous prochainement pour la suite à donner à votre dossier.

Cordialement,
{LAWYER_NAME}"
        };

        return new EmailTemplate
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Empty,
            Name = name,
            Subject = $"Re: {name}",
            Body = templates.GetValueOrDefault(category, templates["general"]),
            CreatedAt = DateTime.UtcNow
        };
    }

    private string PersonalizeTemplate(EmailTemplate template, string clientContext, string subject)
    {
        var body = template.Body;
        
        // Remplacements basiques
        body = body.Replace("{CASE_ID}", $"DOSSIER-{DateTime.Now:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}");
        body = body.Replace("{EMAIL_DATE}", DateTime.Now.ToString("dd/MM/yyyy"));
        body = body.Replace("{LAWYER_NAME}", "Maître [Nom]");
        body = body.Replace("{CLIENT_SUBJECT}", subject);

        // Personnalisation selon le contexte
        if (clientContext.Contains("urgent", StringComparison.OrdinalIgnoreCase))
        {
            body = body.Replace("dans les meilleurs délais", "en urgence");
            body = body.Replace("prochainement", "dans les 24 heures");
        }

        return body;
    }

    public async Task<List<EmailTemplate>> GetUserTemplatesAsync(Guid userId)
    {
        return await _context.EmailTemplates
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<EmailTemplate> CreateTemplateAsync(Guid userId, string name, string category, string subject, string body)
    {
        var normalizedCategory = (category ?? string.Empty).Trim();
        var normalizedName = (name ?? string.Empty).Trim();

        var template = new EmailTemplate
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(normalizedCategory)
                ? normalizedName
                : $"[{normalizedCategory}] {normalizedName}",
            Subject = subject,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailTemplates.Add(template);
        await _context.SaveChangesAsync();
        return template;
    }
}