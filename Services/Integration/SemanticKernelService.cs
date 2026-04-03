using System.Text.Json;

namespace MemoLib.Api.Services.Integration;

public interface ISemanticKernelService
{
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);
    Task<SemanticKernelEmailAnalysis?> AnalyzeEmailAsync(
        string subject,
        string body,
        CancellationToken cancellationToken = default);
}

public class SemanticKernelEmailAnalysis
{
    public string TypeDossier { get; set; } = "GENERAL";
    public string Urgency { get; set; } = "medium";
    public string? Summary { get; set; }
    public decimal Confidence { get; set; }
    public List<string> SuggestedActions { get; set; } = new();
}

public class SemanticKernelService : ISemanticKernelService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SemanticKernelService> _logger;
    private readonly string _baseUrl;

    public SemanticKernelService(HttpClient httpClient, ILogger<SemanticKernelService> logger, IConfiguration config)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = (config["SemanticKernel:BaseUrl"] ?? string.Empty).Trim().TrimEnd('/');
    }

    public async Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_baseUrl))
        {
            return false;
        }

        try
        {
            using var response = await _httpClient.GetAsync(
                $"{_baseUrl}/health",
                cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Semantic Kernel health check failed");
            return false;
        }
    }

    public async Task<SemanticKernelEmailAnalysis?> AnalyzeEmailAsync(
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_baseUrl))
        {
            return null;
        }

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(
                $"{_baseUrl}/api/email/analyze",
                new { subject, body },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogDebug("Semantic Kernel analyze returned status {StatusCode}", response.StatusCode);
                return null;
            }

            var payload = await response.Content.ReadAsStringAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(payload))
            {
                return null;
            }

            using var doc = JsonDocument.Parse(payload);
            var root = doc.RootElement;

            var analysis = new SemanticKernelEmailAnalysis
            {
                TypeDossier = GetString(root, "typeDossier", "GENERAL"),
                Urgency = GetString(root, "urgency", "medium"),
                Summary = GetString(root, "summary", null),
                Confidence = GetDecimal(root, "confidence", 0.9m),
            };

            if (root.TryGetProperty("suggestedActions", out var actions) && actions.ValueKind == JsonValueKind.Array)
            {
                foreach (var action in actions.EnumerateArray())
                {
                    if (action.ValueKind == JsonValueKind.String)
                    {
                        analysis.SuggestedActions.Add(action.GetString() ?? string.Empty);
                    }
                }
            }

            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Semantic Kernel analyze call failed");
            return null;
        }
    }

    private static string GetString(JsonElement root, string property, string? fallback)
    {
        if (root.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString() ?? fallback ?? string.Empty;
        }

        return fallback ?? string.Empty;
    }

    private static decimal GetDecimal(JsonElement root, string property, decimal fallback)
    {
        if (root.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.Number)
        {
            if (value.TryGetDecimal(out var parsedDecimal))
            {
                return parsedDecimal;
            }

            if (value.TryGetDouble(out var parsedDouble))
            {
                return Convert.ToDecimal(parsedDouble);
            }
        }

        return fallback;
    }
}
