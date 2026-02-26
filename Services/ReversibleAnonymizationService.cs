using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MemoLib.Api.Services;

public class ReversibleAnonymizationService
{
    private readonly string _encryptionKey;
    private readonly Dictionary<string, string> _consistentMappings = new();

    public ReversibleAnonymizationService(IConfiguration configuration)
    {
        _encryptionKey = configuration["JwtSettings:SecretKey"] ?? "default-key";
    }

    public UsableAnonymizedData AnonymizeForUser(string originalText, Guid userId)
    {
        var anonymized = originalText;
        var mappings = new Dictionary<string, AnonymizationMapping>();

        // 1. Pseudonymisation des emails (gardent le domaine)
        anonymized = System.Text.RegularExpressions.Regex.Replace(anonymized, 
            @"\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b",
            match => {
                var localPart = match.Groups[1].Value;
                var domain = match.Groups[2].Value;
                var pseudonym = GeneratePseudonym(localPart, userId);
                
                mappings[match.Value] = new AnonymizationMapping
                {
                    Original = match.Value,
                    Pseudonym = $"{pseudonym}@{domain}",
                    Type = "email",
                    IsReversible = true
                };
                
                return $"{pseudonym}@{domain}";
            });

        // 2. Pseudonymisation des noms (garde la structure)
        anonymized = System.Text.RegularExpressions.Regex.Replace(anonymized,
            @"\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b",
            match => {
                var firstName = match.Groups[1].Value;
                var lastName = match.Groups[2].Value;
                var pseudoFirst = GeneratePseudonym(firstName, userId);
                var pseudoLast = GeneratePseudonym(lastName, userId);
                
                mappings[match.Value] = new AnonymizationMapping
                {
                    Original = match.Value,
                    Pseudonym = $"{pseudoFirst} {pseudoLast}",
                    Type = "name",
                    IsReversible = true
                };
                
                return $"{pseudoFirst} {pseudoLast}";
            });

        // 3. Pseudonymisation des téléphones (garde le format)
        anonymized = System.Text.RegularExpressions.Regex.Replace(anonymized,
            @"(\+33|0)([1-9])(?:[.\-\s]?\d{2}){4}",
            match => {
                var original = match.Value;
                var prefix = match.Groups[1].Value;
                var firstDigit = match.Groups[2].Value;
                var hash = GenerateConsistentHash(original, userId);
                var pseudoPhone = $"{prefix}{firstDigit}{hash.Substring(0, 8)}";
                
                mappings[original] = new AnonymizationMapping
                {
                    Original = original,
                    Pseudonym = pseudoPhone,
                    Type = "phone",
                    IsReversible = true
                };
                
                return pseudoPhone;
            });

        return new UsableAnonymizedData
        {
            AnonymizedText = anonymized,
            Mappings = mappings,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsReversible = true
        };
    }

    public string DeanonymizeForUser(string anonymizedText, Dictionary<string, AnonymizationMapping> mappings)
    {
        var result = anonymizedText;
        
        foreach (var mapping in mappings.Values)
        {
            if (mapping.IsReversible)
            {
                result = result.Replace(mapping.Pseudonym, mapping.Original);
            }
        }
        
        return result;
    }

    public ClientAnalytics GenerateClientAnalytics(List<UsableAnonymizedData> clientData)
    {
        var analytics = new ClientAnalytics();
        
        foreach (var data in clientData)
        {
            // Analyser les patterns sans révéler les données
            var emailDomains = data.Mappings.Values
                .Where(m => m.Type == "email")
                .Select(m => m.Pseudonym.Split('@')[1])
                .GroupBy(d => d)
                .ToDictionary(g => g.Key, g => g.Count());
                
            analytics.EmailDomainDistribution = emailDomains;
            
            // Analyser les types de dossiers
            var caseTypes = ExtractCaseTypes(data.AnonymizedText);
            foreach (var type in caseTypes)
            {
                analytics.CaseTypeDistribution[type] = 
                    analytics.CaseTypeDistribution.GetValueOrDefault(type, 0) + 1;
            }
        }
        
        return analytics;
    }

    private string GeneratePseudonym(string input, Guid userId)
    {
        var key = $"{input}_{userId}";
        
        if (_consistentMappings.ContainsKey(key))
            return _consistentMappings[key];
            
        var hash = GenerateConsistentHash(input, userId);
        var pseudonym = $"P{hash.Substring(0, 6)}";
        
        _consistentMappings[key] = pseudonym;
        return pseudonym;
    }

    private string GenerateConsistentHash(string input, Guid userId)
    {
        var combined = $"{input}_{userId}_{_encryptionKey}";
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
        return Convert.ToHexString(hash).Substring(0, 12).ToLowerInvariant();
    }

    private List<string> ExtractCaseTypes(string text)
    {
        var types = new List<string>();
        var keywords = new Dictionary<string, string>
        {
            ["divorce"] = "FAMILLE",
            ["licenciement"] = "TRAVAIL", 
            ["accident"] = "ASSURANCE",
            ["contrat"] = "COMMERCIAL",
            ["immobilier"] = "IMMOBILIER"
        };
        
        foreach (var keyword in keywords)
        {
            if (text.ToLowerInvariant().Contains(keyword.Key))
                types.Add(keyword.Value);
        }
        
        return types;
    }
}

public class UsableAnonymizedData
{
    public string AnonymizedText { get; set; } = string.Empty;
    public Dictionary<string, AnonymizationMapping> Mappings { get; set; } = new();
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsReversible { get; set; }
}

public class AnonymizationMapping
{
    public string Original { get; set; } = string.Empty;
    public string Pseudonym { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsReversible { get; set; }
}

public class ClientAnalytics
{
    public Dictionary<string, int> EmailDomainDistribution { get; set; } = new();
    public Dictionary<string, int> CaseTypeDistribution { get; set; } = new();
    public int TotalClients { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}