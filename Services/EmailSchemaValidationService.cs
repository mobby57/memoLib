using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class EmailSchemaValidationService
{
    private static readonly Regex PhonePattern = new(@"\+?[\d\s\-\(\)]{8,15}", RegexOptions.Compiled);
    private static readonly Regex ClientIdPattern = new(@"ClientId\s*:\s*([A-Z0-9\-]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex NamePattern = new(@"Nom\s*:\s*([^\r\n]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex AddressPattern = new(@"Adresse\s*:\s*([^\r\n]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex AnnexesPattern = new(@"Annexes\s*:\s*([^\r\n]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public EmailSchemaValidation ValidateEmailSchema(string from, string subject, string body)
    {
        var result = new EmailSchemaValidation();
        
        // Validation expéditeur
        if (string.IsNullOrWhiteSpace(from))
        {
            result.AddFlag("MISSING_SENDER");
        }

        // Validation sujet
        if (string.IsNullOrWhiteSpace(subject))
        {
            result.AddFlag("MISSING_SUBJECT");
        }

        // Extraction et validation des données structurées
        var extractedData = ExtractStructuredData(body);
        result.ExtractedData = extractedData;

        // Validation des champs optionnels mais recommandés
        if (string.IsNullOrWhiteSpace(extractedData.Name))
        {
            result.AddWarning("Nom client non spécifié dans le corps");
        }

        if (string.IsNullOrWhiteSpace(extractedData.Phone))
        {
            result.AddWarning("Téléphone non spécifié");
        }

        if (string.IsNullOrWhiteSpace(extractedData.Address))
        {
            result.AddWarning("Adresse non spécifiée");
        }

        // Validation de la longueur du contenu
        if (body.Length < 10)
        {
            result.AddFlag("CONTENT_TOO_SHORT");
        }

        return result;
    }

    private ExtractedEmailData ExtractStructuredData(string body)
    {
        return new ExtractedEmailData
        {
            Name = ExtractField(NamePattern, body),
            Phone = ExtractField(PhonePattern, body),
            Address = ExtractField(AddressPattern, body),
            ClientId = ExtractField(ClientIdPattern, body),
            Annexes = ExtractAnnexes(body)
        };
    }

    private string ExtractField(Regex pattern, string text)
    {
        var match = pattern.Match(text);
        return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
    }

    private List<string> ExtractAnnexes(string body)
    {
        var match = AnnexesPattern.Match(body);
        if (!match.Success) return new List<string>();

        return match.Groups[1].Value
            .Split(';', ',')
            .Select(a => a.Trim())
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .ToList();
    }
}

public class EmailSchemaValidation
{
    public List<string> ValidationFlags { get; } = new();
    public List<string> Warnings { get; } = new();
    public ExtractedEmailData ExtractedData { get; set; } = new();
    public bool IsValid => ValidationFlags.Count == 0;
    public bool HasWarnings => Warnings.Count > 0;

    public void AddFlag(string flag) => ValidationFlags.Add(flag);
    public void AddWarning(string warning) => Warnings.Add(warning);
}

public class ExtractedEmailData
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public List<string> Annexes { get; set; } = new();
}