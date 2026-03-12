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
            // Simulation d'une recherche Dalloz (API fictive)
            var documents = new List<LegalDocument>
            {
                new LegalDocument
                {
                    Id = "dalloz_001",
                    Title = $"Résultat Dalloz pour: {query}",
                    Summary = "Résumé du document juridique Dalloz...",
                    Source = "Dalloz",
                    PublicationDate = DateTime.Now.AddDays(-30),
                    RelevanceScore = 0.85
                }
            };

            await Task.Delay(200); // Simulation latence réseau

            return new LegalSearchResult
            {
                Source = "Dalloz",
                TotalResults = documents.Count,
                Documents = documents,
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
        // Simulation récupération document Dalloz
        await Task.Delay(150);
        
        return new LegalDocument
        {
            Id = documentId,
            Title = "Document Dalloz",
            Content = "Contenu complet du document juridique Dalloz...",
            Source = "Dalloz",
            PublicationDate = DateTime.Now.AddDays(-15)
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
}