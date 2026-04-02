using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class IntelligentWorkspaceOrganizerService
{
    private readonly MemoLibDbContext _context;

    public IntelligentWorkspaceOrganizerService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> GetOrCreateWorkspaceAsync(Guid userId, string emailFrom, string subject, string body)
    {
        var clientEmail = ExtractEmail(emailFrom);
        var keywords = ExtractKeywords(subject, body);
        var category = DetermineCategory(subject, body);

        // Chercher workspace existant par client + catégorie
        var existingWorkspace = await _context.Cases
            .Where(c => c.UserId == userId)
            .Where(c => c.Tags != null && c.Tags.Contains(category))
            .Join(_context.Clients, c => c.ClientId, cl => cl.Id, (c, cl) => new { Case = c, Client = cl })
            .Where(x => x.Client.Email.ToLower() == clientEmail.ToLower())
            .Select(x => x.Case.Id)
            .FirstOrDefaultAsync();

        if (existingWorkspace != Guid.Empty)
            return existingWorkspace;

        // Créer nouveau workspace intelligent
        var client = await GetOrCreateClientAsync(userId, clientEmail, emailFrom);
        var workspaceTitle = GenerateWorkspaceTitle(category, client.Name ?? clientEmail, keywords);

        var workspace = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ClientId = client.Id,
            Title = workspaceTitle,
            Tags = $"{category},{string.Join(",", keywords.Take(3))}",
            Priority = DeterminePriority(subject, body),
            CreatedAt = DateTime.UtcNow
        };

        _context.Cases.Add(workspace);
        await _context.SaveChangesAsync();

        return workspace.Id;
    }

    private async Task<Client> GetOrCreateClientAsync(Guid userId, string email, string fromField)
    {
        var existing = await _context.Clients
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Email.ToLower() == email.ToLower());

        if (existing != null)
            return existing;

        var name = ExtractNameFromEmail(fromField);
        var client = new Client
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Email = email,
            Name = name,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();
        return client;
    }

    private static string ExtractEmail(string fromField) =>
        Regex.Match(fromField, @"[\w\.-]+@[\w\.-]+\.\w+").Value.ToLower();

    private static string ExtractNameFromEmail(string fromField)
    {
        var match = Regex.Match(fromField, @"^([^<]+)<");
        return match.Success ? match.Groups[1].Value.Trim().Trim('"') : "";
    }

    private static List<string> ExtractKeywords(string subject, string body)
    {
        var text = $"{subject} {body}".ToLower();
        var keywords = new List<string>();

        var patterns = new Dictionary<string, string[]>
        {
            ["divorce"] = ["divorce", "séparation", "garde", "pension"],
            ["immobilier"] = ["vente", "achat", "bail", "loyer", "propriété"],
            ["succession"] = ["héritage", "testament", "succession", "décès"],
            ["contrat"] = ["contrat", "accord", "convention", "signature"],
            ["litige"] = ["conflit", "litige", "tribunal", "procès"]
        };

        foreach (var (category, terms) in patterns)
        {
            if (terms.Any(term => text.Contains(term)))
                keywords.Add(category);
        }

        return keywords.Take(5).ToList();
    }

    private static string DetermineCategory(string subject, string body)
    {
        var text = $"{subject} {body}".ToLower();

        if (text.Contains("divorce") || text.Contains("séparation")) return "famille";
        if (text.Contains("vente") || text.Contains("achat") || text.Contains("bail")) return "immobilier";
        if (text.Contains("succession") || text.Contains("héritage")) return "succession";
        if (text.Contains("contrat") || text.Contains("accord")) return "contrat";
        if (text.Contains("litige") || text.Contains("tribunal")) return "contentieux";

        return "general";
    }

    private static string GenerateWorkspaceTitle(string category, string clientName, List<string> keywords)
    {
        var keywordStr = keywords.Any() ? $" - {string.Join(", ", keywords.Take(2))}" : "";
        return $"{category.ToUpper()} - {clientName}{keywordStr}";
    }

    private static int DeterminePriority(string subject, string body)
    {
        var text = $"{subject} {body}".ToLower();
        
        if (text.Contains("urgent") || text.Contains("asap")) return 5;
        if (text.Contains("important") || text.Contains("rapidement")) return 4;
        if (text.Contains("tribunal") || text.Contains("audience")) return 4;
        
        return 3;
    }
}