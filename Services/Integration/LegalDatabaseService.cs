using System.Text.Json;
using System.Xml.Linq;

namespace MemoLib.Api.Services.Integration;

public interface ILegalDatabaseService
{
    Task<LegalSearchResult> SearchLegifrance(string query);
    Task<LegalSearchResult> SearchDalloz(string query);
    Task<LegalDocument> GetDocumentAsync(string source, string documentId);
}

public class LegalSearchResult
{
    public string Source { get; set; } = string.Empty;
    public int TotalResults { get; set; }
    public List<LegalDocument> Documents { get; set; } = new();
    public TimeSpan SearchTime { get; set; }
}

public class LegalDocument
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime PublicationDate { get; set; }
    public List<string> Keywords { get; set; } = new();
    public double RelevanceScore { get; set; }
}

public class LegalDatabaseService : ILegalDatabaseService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LegalDatabaseService> _logger;
    private readonly IConfiguration _config;

    public LegalDatabaseService(HttpClient httpClient, ILogger<LegalDatabaseService> logger, IConfiguration config)
    {
        _httpClient = httpClient;
        _logger = logger;
        _config = config;
    }

    public async Task<LegalSearchResult> SearchLegifrance(string query)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            var apiKey = _config["LegalDatabases:Legifrance:ApiKey"];
            var baseUrl = _config["LegalDatabases:Legifrance:BaseUrl"] ?? "https://api.legifrance.gouv.fr";
            
            var requestUrl = $"{baseUrl}/dila/legifrance/lf-engine-app/search";
            var requestBody = new
            {
                query = query,
                pageSize = 20,
                pageNumber = 1,
                sort = "PERTINENCE",
                typePagination = "DEFAULT"
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);

            var response = await _httpClient.PostAsJsonAsync(requestUrl, requestBody);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var searchResponse = JsonSerializer.Deserialize<LegifranceSearchResponse>(jsonResponse);

            var documents = searchResponse?.Results?.Select(r => new LegalDocument
            {
                Id = r.Id ?? "",
                Title = r.Title ?? "",
                Summary = r.Summary ?? "",
                Source = "Légifrance",
                Url = r.Url ?? "",
                PublicationDate = DateTime.TryParse(r.PublicationDate, out var date) ? date : DateTime.MinValue,
                RelevanceScore = r.Score
            }).ToList() ?? new List<LegalDocument>();

            return new LegalSearchResult
            {
                Source = "Légifrance",
                TotalResults = searchResponse?.TotalCount ?? 0,
                Documents = documents,
                SearchTime = DateTime.UtcNow - startTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search Légifrance for query: {Query}", query);
            return new LegalSearchResult
            {
                Source = "Légifrance",
                SearchTime = DateTime.UtcNow - startTime
            };
        }
    }

    public async Task<LegalSearchResult> SearchDalloz(string query)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            var apiKey = _config["LegalDatabases:Dalloz:ApiKey"];
            var baseUrl = _config["LegalDatabases:Dalloz:BaseUrl"] ?? "https://api.dalloz.fr";

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
                _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

                var requestBody = new { query, limit = 20, offset = 0 };
                var response = await _httpClient.PostAsJsonAsync($"{baseUrl}/v1/search", requestBody);

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    var searchResponse = JsonSerializer.Deserialize<DallozSearchResponse>(jsonResponse);

                    var documents = searchResponse?.Results?.Select(r => new LegalDocument
                    {
                        Id = r.Id ?? "",
                        Title = r.Title ?? "",
                        Summary = r.Abstract ?? "",
                        Source = "Dalloz",
                        Url = r.Url ?? "",
                        PublicationDate = DateTime.TryParse(r.Date, out var date) ? date : DateTime.MinValue,
                        RelevanceScore = r.Score
                    }).ToList() ?? new List<LegalDocument>();

                    return new LegalSearchResult
                    {
                        Source = "Dalloz",
                        TotalResults = searchResponse?.Total ?? documents.Count,
                        Documents = documents,
                        SearchTime = DateTime.UtcNow - startTime
                    };
                }

                _logger.LogWarning("Dalloz API returned {Status}", response.StatusCode);
            }
            else
            {
                _logger.LogWarning("Dalloz API key not configured (LegalDatabases:Dalloz:ApiKey)");
            }

            // Fallback: recherche locale simulée si API non disponible
            return new LegalSearchResult
            {
                Source = "Dalloz",
                TotalResults = 0,
                Documents = new List<LegalDocument>(),
                SearchTime = DateTime.UtcNow - startTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search Dalloz for query: {Query}", query);
            return new LegalSearchResult
            {
                Source = "Dalloz",
                SearchTime = DateTime.UtcNow - startTime
            };
        }
    }

    public async Task<LegalDocument> GetDocumentAsync(string source, string documentId)
    {
        try
        {
            return source.ToLower() switch
            {
                "legifrance" => await GetLegifranceDocumentAsync(documentId),
                "dalloz" => await GetDallozDocumentAsync(documentId),
                _ => throw new ArgumentException($"Unknown legal database source: {source}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get document {DocumentId} from {Source}", documentId, source);
            throw;
        }
    }

    private async Task<LegalDocument> GetLegifranceDocumentAsync(string documentId)
    {
        var apiKey = _config["LegalDatabases:Legifrance:ApiKey"];
        var baseUrl = _config["LegalDatabases:Legifrance:BaseUrl"] ?? "https://api.legifrance.gouv.fr";
        
        var requestUrl = $"{baseUrl}/dila/legifrance/lf-engine-app/consult/{documentId}";
        
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var response = await _httpClient.GetAsync(requestUrl);
        response.EnsureSuccessStatusCode();

        var jsonResponse = await response.Content.ReadAsStringAsync();
        var document = JsonSerializer.Deserialize<LegifranceDocument>(jsonResponse);

        return new LegalDocument
        {
            Id = documentId,
            Title = document?.Title ?? "",
            Content = document?.Content ?? "",
            Source = "Légifrance",
            PublicationDate = DateTime.TryParse(document?.PublicationDate, out var date) ? date : DateTime.MinValue
        };
    }

    private async Task<LegalDocument> GetDallozDocumentAsync(string documentId)
    {
        var apiKey = _config["LegalDatabases:Dalloz:ApiKey"];
        var baseUrl = _config["LegalDatabases:Dalloz:BaseUrl"] ?? "https://api.dalloz.fr";

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.GetAsync($"{baseUrl}/v1/documents/{documentId}");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonSerializer.Deserialize<DallozDocument>(json);
                return new LegalDocument
                {
                    Id = documentId,
                    Title = doc?.Title ?? "",
                    Content = doc?.Content ?? "",
                    Source = "Dalloz",
                    PublicationDate = DateTime.TryParse(doc?.Date, out var date) ? date : DateTime.MinValue
                };
            }
        }

        return new LegalDocument
        {
            Id = documentId,
            Title = "Document Dalloz",
            Content = "Document non disponible (API Dalloz non configurée)",
            Source = "Dalloz"
        };
    }

    private class LegifranceSearchResponse
    {
        public int TotalCount { get; set; }
        public List<LegifranceResult>? Results { get; set; }
    }

    private class LegifranceResult
    {
        public string? Id { get; set; }
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? Url { get; set; }
        public string? PublicationDate { get; set; }
        public double Score { get; set; }
    }

    private class LegifranceDocument
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? PublicationDate { get; set; }
    }

    private class DallozSearchResponse
    {
        public int Total { get; set; }
        public List<DallozResult>? Results { get; set; }
    }

    private class DallozResult
    {
        public string? Id { get; set; }
        public string? Title { get; set; }
        public string? Abstract { get; set; }
        public string? Url { get; set; }
        public string? Date { get; set; }
        public double Score { get; set; }
    }

    private class DallozDocument
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Date { get; set; }
    }
}