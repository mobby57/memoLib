using System.Text.Json;

namespace MemoLib.Api.Services.Integration;

public interface IOpenAIService
{
    Task<string> GenerateTextAsync(string prompt, AIModel model = AIModel.GPT35Turbo);
    Task<List<string>> GenerateEmbeddingsAsync(string text);
    Task<AIAnalysisResult> AnalyzeDocumentAsync(string content, AIAnalysisType type);
    Task<string> SummarizeEmailAsync(string emailContent);
}

public enum AIModel
{
    GPT35Turbo,
    GPT4,
    TextEmbedding
}

public enum AIAnalysisType
{
    LegalDocumentAnalysis,
    ContractReview,
    EmailClassification,
    ClientSentimentAnalysis
}

public class AIAnalysisResult
{
    public string Summary { get; set; } = string.Empty;
    public List<string> KeyPoints { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public double ConfidenceScore { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class OpenAIService : IOpenAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenAIService> _logger;
    private readonly string _apiKey;

    public OpenAIService(HttpClient httpClient, ILogger<OpenAIService> logger, IConfiguration config)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["OpenAI:ApiKey"] ?? "";
        
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "MemoLib/1.0");
    }

    public async Task<string> GenerateTextAsync(string prompt, AIModel model = AIModel.GPT35Turbo)
    {
        try
        {
            var modelName = model switch
            {
                AIModel.GPT35Turbo => "gpt-3.5-turbo",
                AIModel.GPT4 => "gpt-4",
                _ => "gpt-3.5-turbo"
            };

            var request = new
            {
                model = modelName,
                messages = new[]
                {
                    new { role = "system", content = "Vous êtes un assistant juridique expert." },
                    new { role = "user", content = prompt }
                },
                max_tokens = 1000,
                temperature = 0.7
            };

            var response = await _httpClient.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", request);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OpenAIResponse>(jsonResponse);
            
            return result?.Choices?.FirstOrDefault()?.Message?.Content ?? "";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate text with OpenAI");
            return "Erreur lors de la génération de texte IA.";
        }
    }

    public async Task<List<string>> GenerateEmbeddingsAsync(string text)
    {
        try
        {
            var request = new
            {
                model = "text-embedding-ada-002",
                input = text
            };

            var response = await _httpClient.PostAsJsonAsync("https://api.openai.com/v1/embeddings", request);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<OpenAIEmbeddingResponse>(jsonResponse);
            
            return result?.Data?.FirstOrDefault()?.Embedding?.Select(f => f.ToString()).ToList() ?? new List<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embeddings with OpenAI");
            return new List<string>();
        }
    }

    public async Task<AIAnalysisResult> AnalyzeDocumentAsync(string content, AIAnalysisType type)
    {
        var prompt = type switch
        {
            AIAnalysisType.LegalDocumentAnalysis => 
                $"Analysez ce document juridique et identifiez les points clés, les obligations, et les risques potentiels:\n\n{content}",
            AIAnalysisType.ContractReview => 
                $"Examinez ce contrat et identifiez les clauses importantes, les risques, et les recommandations:\n\n{content}",
            AIAnalysisType.EmailClassification => 
                $"Classifiez cet email selon son urgence et son type (consultation, contentieux, administratif):\n\n{content}",
            AIAnalysisType.ClientSentimentAnalysis => 
                $"Analysez le sentiment et le niveau de satisfaction de ce message client:\n\n{content}",
            _ => $"Analysez ce document:\n\n{content}"
        };

        var analysisText = await GenerateTextAsync(prompt);
        
        return new AIAnalysisResult
        {
            Summary = ExtractSummary(analysisText),
            KeyPoints = ExtractKeyPoints(analysisText),
            Recommendations = ExtractRecommendations(analysisText),
            ConfidenceScore = 0.85, // Score simulé
            Metadata = new Dictionary<string, object>
            {
                ["analysisType"] = type.ToString(),
                ["contentLength"] = content.Length,
                ["processedAt"] = DateTime.UtcNow
            }
        };
    }

    public async Task<string> SummarizeEmailAsync(string emailContent)
    {
        var prompt = $"Résumez cet email en 2-3 phrases, en identifiant l'objet principal et les actions requises:\n\n{emailContent}";
        return await GenerateTextAsync(prompt);
    }

    private string ExtractSummary(string analysisText)
    {
        var lines = analysisText.Split('\n');
        return lines.FirstOrDefault(l => l.Contains("Résumé") || l.Contains("Summary")) ?? 
               lines.Take(2).FirstOrDefault() ?? "";
    }

    private List<string> ExtractKeyPoints(string analysisText)
    {
        var lines = analysisText.Split('\n');
        return lines
            .Where(l => l.StartsWith("- ") || l.StartsWith("• ") || l.Contains("Point clé"))
            .Take(5)
            .ToList();
    }

    private List<string> ExtractRecommendations(string analysisText)
    {
        var lines = analysisText.Split('\n');
        return lines
            .Where(l => l.Contains("Recommandation") || l.Contains("Conseil") || l.Contains("Action"))
            .Take(3)
            .ToList();
    }

    private class OpenAIResponse
    {
        public List<OpenAIChoice>? Choices { get; set; }
    }

    private class OpenAIChoice
    {
        public OpenAIMessage? Message { get; set; }
    }

    private class OpenAIMessage
    {
        public string? Content { get; set; }
    }

    private class OpenAIEmbeddingResponse
    {
        public List<OpenAIEmbeddingData>? Data { get; set; }
    }

    private class OpenAIEmbeddingData
    {
        public List<float>? Embedding { get; set; }
    }
}