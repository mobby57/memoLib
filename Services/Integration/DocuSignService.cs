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

        // Stub: retourne un ID simulé tant que DocuSign n'est pas configuré
        var apiKey = _config["DocuSign:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("DocuSign API key not configured, returning simulated envelope");
            await Task.CompletedTask;
            return $"sim_{Guid.NewGuid():N}";
        }

        // TODO: Intégration réelle DocuSign API
        await Task.CompletedTask;
        return $"env_{Guid.NewGuid():N}";
    }

    public async Task<EnvelopeStatus> GetEnvelopeStatusAsync(string envelopeId)
    {
        _logger.LogInformation("Getting status for envelope: {EnvelopeId}", envelopeId);
        await Task.CompletedTask;

        if (envelopeId.StartsWith("sim_"))
            return EnvelopeStatus.Created;

        return EnvelopeStatus.Sent;
    }
}
