namespace MemoLib.Api.Services.Integration;

public interface IDocuSignService
{
    Task<string> CreateEnvelopeAsync(DocumentSigningRequest request);
    Task<EnvelopeStatus> GetEnvelopeStatusAsync(string envelopeId);
}

public enum EnvelopeStatus
{
    Created,
    Sent,
    Delivered,
    Signed,
    Completed,
    Declined,
    Voided
}

public class DocumentSigningRequest
{
    public string DocumentName { get; set; } = string.Empty;
    public byte[] DocumentContent { get; set; } = Array.Empty<byte>();
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<SignerInfo> Signers { get; set; } = new();
}

public class SignerInfo
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int RoutingOrder { get; set; }
}

public class DocuSignService : IDocuSignService
{
    private readonly ILogger<DocuSignService> _logger;
    private readonly IConfiguration _config;

    public DocuSignService(ILogger<DocuSignService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public async Task<string> CreateEnvelopeAsync(DocumentSigningRequest request)
    {
        _logger.LogInformation("Creating DocuSign envelope for document: {DocumentName}", request.DocumentName);

        var apiKey = _config["DocuSign:ApiKey"];
        var accountId = _config["DocuSign:AccountId"];
        var baseUrl = _config["DocuSign:BaseUrl"] ?? "https://demo.docusign.net/restapi";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(accountId))
        {
            _logger.LogWarning("DocuSign non configuré (DocuSign:ApiKey + DocuSign:AccountId requis), mode simulation");
            await Task.CompletedTask;
            return $"sim_{Guid.NewGuid():N}";
        }

        try
        {
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            httpClient.DefaultRequestHeaders.Add("Accept", "application/json");

            var signers = request.Signers.Select((s, i) => new
            {
                email = s.Email,
                name = s.Name,
                recipientId = (i + 1).ToString(),
                routingOrder = s.RoutingOrder.ToString(),
                tabs = new
                {
                    signHereTabs = new[]
                    {
                        new { documentId = "1", pageNumber = "1", xPosition = "200", yPosition = "700" }
                    }
                }
            }).ToArray();

            var envelope = new
            {
                emailSubject = request.Subject,
                emailBlurb = request.Message,
                documents = new[]
                {
                    new
                    {
                        documentBase64 = Convert.ToBase64String(request.DocumentContent),
                        name = request.DocumentName,
                        fileExtension = "pdf",
                        documentId = "1"
                    }
                },
                recipients = new { signers },
                status = "sent"
            };

            var response = await httpClient.PostAsJsonAsync(
                $"{baseUrl}/v2.1/accounts/{accountId}/envelopes", envelope);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var doc = System.Text.Json.JsonDocument.Parse(json);
                var envelopeId = doc.RootElement.GetProperty("envelopeId").GetString();
                _logger.LogInformation("DocuSign envelope créé: {EnvelopeId}", envelopeId);
                return envelopeId ?? $"env_{Guid.NewGuid():N}";
            }

            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Échec DocuSign: {Status} {Error}", response.StatusCode, error);
            return $"err_{Guid.NewGuid():N}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur DocuSign API");
            return $"err_{Guid.NewGuid():N}";
        }
    }

    public async Task<EnvelopeStatus> GetEnvelopeStatusAsync(string envelopeId)
    {
        _logger.LogInformation("Getting status for envelope: {EnvelopeId}", envelopeId);

        if (envelopeId.StartsWith("sim_") || envelopeId.StartsWith("err_"))
        {
            await Task.CompletedTask;
            return EnvelopeStatus.Created;
        }

        var apiKey = _config["DocuSign:ApiKey"];
        var accountId = _config["DocuSign:AccountId"];
        var baseUrl = _config["DocuSign:BaseUrl"] ?? "https://demo.docusign.net/restapi";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(accountId))
        {
            await Task.CompletedTask;
            return EnvelopeStatus.Created;
        }

        try
        {
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await httpClient.GetAsync(
                $"{baseUrl}/v2.1/accounts/{accountId}/envelopes/{envelopeId}");

            if (!response.IsSuccessStatusCode)
                return EnvelopeStatus.Created;

            var json = await response.Content.ReadAsStringAsync();
            var doc = System.Text.Json.JsonDocument.Parse(json);
            var status = doc.RootElement.GetProperty("status").GetString();

            return status?.ToLower() switch
            {
                "created" => EnvelopeStatus.Created,
                "sent" => EnvelopeStatus.Sent,
                "delivered" => EnvelopeStatus.Delivered,
                "signed" => EnvelopeStatus.Signed,
                "completed" => EnvelopeStatus.Completed,
                "declined" => EnvelopeStatus.Declined,
                "voided" => EnvelopeStatus.Voided,
                _ => EnvelopeStatus.Created
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur récupération statut DocuSign");
            return EnvelopeStatus.Created;
        }
    }
}
