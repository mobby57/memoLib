using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class IntelligentEmailAdapterService
{
    private static readonly Regex[] PhonePatterns = {
        new(@"(\+33|0)[1-9](?:[.\-\s]?\d{2}){4}", RegexOptions.Compiled),
        new(@"(\d{2}[.\-\s]?){5}", RegexOptions.Compiled),
        new(@"(\+\d{1,3}[.\-\s]?)?\d{8,12}", RegexOptions.Compiled)
    };

    private static readonly Regex[] NamePatterns = {
        new(@"(?:je suis|mon nom est|je m'appelle)\s+([A-Za-zÀ-ÿ\s\-]{2,30})", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"^([A-Z][a-zÀ-ÿ]+\s+[A-Z][a-zÀ-ÿ]+)", RegexOptions.Compiled),
        new(@"cordialement,?\s*([A-Za-zÀ-ÿ\s\-]{2,30})", RegexOptions.IgnoreCase | RegexOptions.Compiled)
    };

    private static readonly Regex[] AddressPatterns = {
        new(@"(\d+[,\s]+[^,\n]+[,\s]+\d{5}[,\s]+[A-Za-zÀ-ÿ\s\-]+)", RegexOptions.Compiled),
        new(@"(?:j'habite|domicilié|adresse)[:\s]+([^\n\r]{10,100})", RegexOptions.IgnoreCase | RegexOptions.Compiled)
    };

    private static readonly string[] UrgentKeywords = {
        "urgent", "rapidement", "vite", "immédiat", "emergency", "asap"
    };

    private static readonly Dictionary<string, string> CaseTypeKeywords = new()
    {
        { "divorce", "FAMILLE" },
        { "licenciement", "TRAVAIL" },
        { "accident", "ASSURANCE" },
        { "succession", "FAMILLE" },
        { "contrat", "COMMERCIAL" },
        { "immobilier", "IMMOBILIER" },
        { "pénal", "PENAL" }
    };

    public AdaptedEmailData AdaptAnyEmail(string from, string subject, string body)
    {
        var adapted = new AdaptedEmailData
        {
            OriginalFrom = from,
            OriginalSubject = subject,
            OriginalBody = body
        };

        // 1. Extraction intelligente du nom
        adapted.ExtractedName = ExtractName(body, from);

        // 2. Extraction du téléphone
        adapted.ExtractedPhone = ExtractPhone(body);

        // 3. Extraction de l'adresse
        adapted.ExtractedAddress = ExtractAddress(body);

        // 4. Détection du type de dossier
        adapted.CaseType = DetectCaseType(subject, body);

        // 5. Détection de l'urgence
        adapted.Priority = DetectPriority(subject, body);

        // 6. Génération du titre intelligent
        adapted.GeneratedTitle = GenerateTitle(subject, adapted.CaseType);

        // 7. Extraction du contenu principal
        adapted.CleanedContent = CleanContent(body);

        return adapted;
    }

    private string ExtractName(string body, string from)
    {
        // Essayer les patterns de nom dans le corps
        foreach (var pattern in NamePatterns)
        {
            var match = pattern.Match(body);
            if (match.Success)
                return match.Groups[1].Value.Trim();
        }

        // Fallback: utiliser la partie avant @ de l'email
        var emailName = from.Split('@')[0];
        return emailName.Replace(".", " ").Replace("_", " ");
    }

    private string ExtractPhone(string body)
    {
        foreach (var pattern in PhonePatterns)
        {
            var match = pattern.Match(body);
            if (match.Success)
                return match.Value.Trim();
        }
        return string.Empty;
    }

    private string ExtractAddress(string body)
    {
        foreach (var pattern in AddressPatterns)
        {
            var match = pattern.Match(body);
            if (match.Success)
                return match.Groups[1].Value.Trim();
        }
        return string.Empty;
    }

    private string DetectCaseType(string subject, string body)
    {
        var text = $"{subject} {body}".ToLowerInvariant();
        
        foreach (var keyword in CaseTypeKeywords)
        {
            if (text.Contains(keyword.Key))
                return keyword.Value;
        }
        
        return "GENERAL";
    }

    private int DetectPriority(string subject, string body)
    {
        var text = $"{subject} {body}".ToLowerInvariant();
        
        if (UrgentKeywords.Any(keyword => text.Contains(keyword)))
            return 5; // Urgent
            
        if (text.Contains("important"))
            return 4; // Important
            
        return 3; // Normal
    }

    private string GenerateTitle(string subject, string caseType)
    {
        if (!string.IsNullOrWhiteSpace(subject))
            return $"[{caseType}] {subject}";
            
        return $"[{caseType}] Nouvelle demande";
    }

    private string CleanContent(string body)
    {
        // Supprimer les signatures automatiques
        var lines = body.Split('\n');
        var cleanLines = new List<string>();
        
        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            
            // Ignorer les lignes de signature communes
            if (trimmed.StartsWith("--") || 
                trimmed.StartsWith("Envoyé depuis") ||
                trimmed.Contains("virus") ||
                trimmed.Length < 3)
                continue;
                
            cleanLines.Add(trimmed);
        }
        
        return string.Join("\n", cleanLines).Trim();
    }
}

public class AdaptedEmailData
{
    public string OriginalFrom { get; set; } = string.Empty;
    public string OriginalSubject { get; set; } = string.Empty;
    public string OriginalBody { get; set; } = string.Empty;
    
    public string ExtractedName { get; set; } = string.Empty;
    public string ExtractedPhone { get; set; } = string.Empty;
    public string ExtractedAddress { get; set; } = string.Empty;
    
    public string CaseType { get; set; } = "GENERAL";
    public int Priority { get; set; } = 3;
    public string GeneratedTitle { get; set; } = string.Empty;
    public string CleanedContent { get; set; } = string.Empty;
    
    public bool HasExtractedData => 
        !string.IsNullOrWhiteSpace(ExtractedName) || 
        !string.IsNullOrWhiteSpace(ExtractedPhone) || 
        !string.IsNullOrWhiteSpace(ExtractedAddress);
}