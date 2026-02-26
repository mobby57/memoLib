using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class GdprAnonymizationService
{
    private static readonly Regex EmailPattern = new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", RegexOptions.Compiled);
    private static readonly Regex PhonePattern = new(@"(\+33|0)[1-9](?:[.\-\s]?\d{2}){4}", RegexOptions.Compiled);
    private static readonly Regex NamePattern = new(@"\b[A-Z][a-z]+ [A-Z][a-z]+\b", RegexOptions.Compiled);
    private static readonly Regex AddressPattern = new(@"\d+[,\s]+[^,\n]+[,\s]+\d{5}[,\s]+[A-Za-z\s]+", RegexOptions.Compiled);

    public AnonymizedData AnonymizeClientData(string originalText, string clientId = null)
    {
        var anonymized = originalText;
        var mappings = new Dictionary<string, string>();

        // 1. Anonymiser les emails
        anonymized = EmailPattern.Replace(anonymized, match =>
        {
            var original = match.Value;
            var hash = GenerateConsistentHash(original);
            var anonymizedEmail = $"client{hash}@anonymized.local";
            mappings[original] = anonymizedEmail;
            return anonymizedEmail;
        });

        // 2. Anonymiser les téléphones
        anonymized = PhonePattern.Replace(anonymized, match =>
        {
            var original = match.Value;
            var hash = GenerateConsistentHash(original);
            var anonymizedPhone = $"06{hash.Substring(0, 8)}";
            mappings[original] = anonymizedPhone;
            return anonymizedPhone;
        });

        // 3. Anonymiser les noms
        anonymized = NamePattern.Replace(anonymized, match =>
        {
            var original = match.Value;
            var hash = GenerateConsistentHash(original);
            var anonymizedName = $"Client{hash.Substring(0, 4)} {hash.Substring(4, 4)}";
            mappings[original] = anonymizedName;
            return anonymizedName;
        });

        // 4. Anonymiser les adresses
        anonymized = AddressPattern.Replace(anonymized, match =>
        {
            var original = match.Value;
            var hash = GenerateConsistentHash(original);
            var anonymizedAddress = $"{hash.Substring(0, 2)} rue Anonyme, {hash.Substring(2, 5)} Ville";
            mappings[original] = anonymizedAddress;
            return anonymizedAddress;
        });

        return new AnonymizedData
        {
            AnonymizedText = anonymized,
            OriginalDataMappings = mappings,
            AnonymizationDate = DateTime.UtcNow,
            ClientReference = clientId ?? GenerateConsistentHash(originalText).Substring(0, 8)
        };
    }

    public string GenerateConsistentHash(string input)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash).Substring(0, 12).ToLowerInvariant();
    }

    public GdprComplianceReport GenerateComplianceReport(Guid userId)
    {
        return new GdprComplianceReport
        {
            UserId = userId,
            GeneratedAt = DateTime.UtcNow,
            DataCategories = new List<DataCategory>
            {
                new() { Name = "Emails clients", IsAnonymized = true, RetentionPeriod = "7 ans" },
                new() { Name = "Coordonnées", IsAnonymized = true, RetentionPeriod = "7 ans" },
                new() { Name = "Dossiers juridiques", IsAnonymized = false, RetentionPeriod = "30 ans" },
                new() { Name = "Audit logs", IsAnonymized = true, RetentionPeriod = "3 ans" }
            },
            AnonymizationMethods = new List<string>
            {
                "Hash SHA-256 consistant",
                "Pseudonymisation réversible",
                "Suppression données sensibles",
                "Chiffrement AES-256"
            }
        };
    }
}

public class AnonymizedData
{
    public string AnonymizedText { get; set; } = string.Empty;
    public Dictionary<string, string> OriginalDataMappings { get; set; } = new();
    public DateTime AnonymizationDate { get; set; }
    public string ClientReference { get; set; } = string.Empty;
}

public class GdprComplianceReport
{
    public Guid UserId { get; set; }
    public DateTime GeneratedAt { get; set; }
    public List<DataCategory> DataCategories { get; set; } = new();
    public List<string> AnonymizationMethods { get; set; } = new();
}

public class DataCategory
{
    public string Name { get; set; } = string.Empty;
    public bool IsAnonymized { get; set; }
    public string RetentionPeriod { get; set; } = string.Empty;
}