using System.Text.RegularExpressions;
using MemoLib.Api.Services.Integration;

namespace MemoLib.Api.Services;

public class EmailClassificationService
{
    private readonly IOpenAIService _openAIService;
    private readonly ILogger<EmailClassificationService> _logger;
    private readonly IConfiguration _config;

    public EmailClassificationService(
        IOpenAIService openAIService,
        ILogger<EmailClassificationService> logger,
        IConfiguration config)
    {
        _openAIService = openAIService;
        _logger = logger;
        _config = config;
    }

    public async Task<EmailClassification> ClassifyAsync(string from, string subject, string body)
    {
        var result = new EmailClassification
        {
            Category = ClassifyByRules(subject, body),
            Urgency = DetectUrgency(subject, body),
            Sentiment = "NEUTRAL",
            SuggestedTags = ExtractTags(subject, body),
            SuggestedPriority = 0
        };

        // Si OpenAI est configuré, enrichir avec l'IA
        var useAI = _config.GetValue<bool>("EmailClassification:UseAI");
        var apiKey = _config["OpenAI:ApiKey"];

        if (useAI && !string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var aiResult = await _openAIService.AnalyzeDocumentAsync(
                    $"De: {from}\nObjet: {subject}\n\n{Truncate(body, 2000)}",
                    AIAnalysisType.EmailClassification);

                result.AISummary = aiResult.Summary;
                result.AIKeyPoints = aiResult.KeyPoints;
                result.Confidence = aiResult.ConfidenceScore;

                // Extraire catégorie IA depuis les metadata
                if (aiResult.Metadata.TryGetValue("category", out var aiCat) && aiCat is string cat)
                    result.Category = cat;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Classification IA échouée, fallback règles");
            }
        }

        result.SuggestedPriority = ComputePriority(result.Category, result.Urgency);
        return result;
    }

    private static string ClassifyByRules(string subject, string body)
    {
        var text = $"{subject} {body}".ToLowerInvariant();

        if (Regex.IsMatch(text, @"\b(tribunal|audience|assignation|jugement|arrêt|cour|greffe)\b"))
            return "CONTENTIEUX";
        if (Regex.IsMatch(text, @"\b(contrat|bail|cession|statuts|société|sarl|sas|acte)\b"))
            return "CORPORATE";
        if (Regex.IsMatch(text, @"\b(divorce|pension|garde|enfant|mariage|séparation)\b"))
            return "FAMILLE";
        if (Regex.IsMatch(text, @"\b(licenciement|prud|salaire|travail|employeur|salarié)\b"))
            return "TRAVAIL";
        if (Regex.IsMatch(text, @"\b(facture|paiement|honoraire|provision|règlement)\b"))
            return "FACTURATION";
        if (Regex.IsMatch(text, @"\b(rendez-vous|rdv|consultation|question|renseignement)\b"))
            return "CONSULTATION";
        if (Regex.IsMatch(text, @"\b(pénal|plainte|infraction|garde à vue|délit|crime)\b"))
            return "PENAL";
        if (Regex.IsMatch(text, @"\b(immobilier|vente|achat|copropriété|locataire|propriétaire)\b"))
            return "IMMOBILIER";

        return "GENERAL";
    }

    private static string DetectUrgency(string subject, string body)
    {
        var text = $"{subject} {body}".ToLowerInvariant();

        if (Regex.IsMatch(text, @"\b(urgent|urgence|immédiat|asap|délai\s*24h|aujourd'hui)\b"))
            return "CRITICAL";
        if (Regex.IsMatch(text, @"\b(rapide|rapidement|dès que possible|prioritaire|important)\b"))
            return "HIGH";
        if (Regex.IsMatch(text, @"\b(quand vous pourrez|pas pressé|à votre convenance)\b"))
            return "LOW";

        return "NORMAL";
    }

    private static List<string> ExtractTags(string subject, string body)
    {
        var tags = new List<string>();
        var text = $"{subject} {body}".ToLowerInvariant();

        var tagPatterns = new Dictionary<string, string>
        {
            ["urgent"] = @"\b(urgent|urgence)\b",
            ["famille"] = @"\b(divorce|pension|garde|enfant|famille)\b",
            ["pénal"] = @"\b(pénal|plainte|infraction)\b",
            ["travail"] = @"\b(licenciement|prud|travail|salarié)\b",
            ["immobilier"] = @"\b(immobilier|bail|locataire|copropriété)\b",
            ["corporate"] = @"\b(société|statuts|cession|sarl|sas)\b",
            ["contentieux"] = @"\b(tribunal|audience|assignation|jugement)\b",
            ["facturation"] = @"\b(facture|paiement|honoraire)\b",
            ["nouveau-client"] = @"\b(nouveau client|première fois|premier contact)\b"
        };

        foreach (var (tag, pattern) in tagPatterns)
        {
            if (Regex.IsMatch(text, pattern))
                tags.Add(tag);
        }

        return tags;
    }

    private static int ComputePriority(string category, string urgency)
    {
        var basePriority = category switch
        {
            "CONTENTIEUX" or "PENAL" => 3,
            "FAMILLE" or "TRAVAIL" => 2,
            _ => 1
        };

        var urgencyBoost = urgency switch
        {
            "CRITICAL" => 2,
            "HIGH" => 1,
            _ => 0
        };

        return Math.Min(basePriority + urgencyBoost, 5);
    }

    private static string Truncate(string? text, int max) =>
        string.IsNullOrEmpty(text) ? "" : text.Length <= max ? text : text[..max];
}

public class EmailClassification
{
    public string Category { get; set; } = "GENERAL";
    public string Urgency { get; set; } = "NORMAL";
    public string Sentiment { get; set; } = "NEUTRAL";
    public int SuggestedPriority { get; set; }
    public List<string> SuggestedTags { get; set; } = new();
    public string? AISummary { get; set; }
    public List<string>? AIKeyPoints { get; set; }
    public double Confidence { get; set; }
}
