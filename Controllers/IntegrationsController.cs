using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services.Integration;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/integrations")]
[Authorize]
public class IntegrationsController : ControllerBase
{
    private readonly IEmailAdapter _emailAdapter;
    private readonly IDocuSignService _docuSignService;
    private readonly ILegalDatabaseService _legalDatabaseService;
    private readonly IOpenAIService _openAIService;
    private readonly INotificationChannelService _notificationService;
    private readonly IIntegrationMonitorService _monitorService;
    private readonly ILogger<IntegrationsController> _logger;

    public IntegrationsController(
        IEmailAdapter emailAdapter,
        IDocuSignService docuSignService,
        ILegalDatabaseService legalDatabaseService,
        IOpenAIService openAIService,
        INotificationChannelService notificationService,
        IIntegrationMonitorService monitorService,
        ILogger<IntegrationsController> logger)
    {
        _emailAdapter = emailAdapter;
        _docuSignService = docuSignService;
        _legalDatabaseService = legalDatabaseService;
        _openAIService = openAIService;
        _notificationService = notificationService;
        _monitorService = monitorService;
        _logger = logger;
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealthStatus()
    {
        var healthStatus = await _monitorService.CheckAllHealthAsync();
        return Ok(healthStatus);
    }

    [HttpPost("email/test")]
    public async Task<IActionResult> TestEmailConnection()
    {
        var isConnected = await _emailAdapter.TestConnectionAsync();
        return Ok(new { connected = isConnected });
    }

    [HttpPost("email/send")]
    public async Task<IActionResult> SendEmail([FromBody] EmailSendRequest request)
    {
        var email = new EmailMessage
        {
            ToEmail = request.To,
            Subject = request.Subject,
            Body = request.Body
        };

        var success = await _emailAdapter.SendEmailAsync(email);
        return Ok(new { success });
    }

    [HttpPost("docusign/envelope")]
    public async Task<IActionResult> CreateSigningEnvelope([FromBody] SigningEnvelopeRequest request)
    {
        try
        {
            var signingRequest = new DocumentSigningRequest
            {
                DocumentName = request.DocumentName,
                DocumentContent = Convert.FromBase64String(request.DocumentBase64),
                Subject = request.Subject,
                Message = request.Message,
                Signers = request.Signers.Select(s => new SignerInfo
                {
                    Name = s.Name,
                    Email = s.Email,
                    RoutingOrder = s.RoutingOrder
                }).ToList()
            };

            var envelopeId = await _docuSignService.CreateEnvelopeAsync(signingRequest);
            return Ok(new { envelopeId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create DocuSign envelope");
            return BadRequest(new { error = "Failed to create signing envelope" });
        }
    }

    [HttpGet("docusign/envelope/{envelopeId}/status")]
    public async Task<IActionResult> GetEnvelopeStatus(string envelopeId)
    {
        try
        {
            var status = await _docuSignService.GetEnvelopeStatusAsync(envelopeId);
            return Ok(new { status = status.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get envelope status for {EnvelopeId}", envelopeId);
            return BadRequest(new { error = "Failed to get envelope status" });
        }
    }

    [HttpPost("legal/search")]
    public async Task<IActionResult> SearchLegalDatabases([FromBody] LegalSearchRequest request)
    {
        var tasks = new List<Task<LegalSearchResult>>();

        if (request.Sources.Contains("legifrance"))
            tasks.Add(_legalDatabaseService.SearchLegifrance(request.Query));
        
        if (request.Sources.Contains("dalloz"))
            tasks.Add(_legalDatabaseService.SearchDalloz(request.Query));

        var results = await Task.WhenAll(tasks);
        
        return Ok(new
        {
            query = request.Query,
            results = results.SelectMany(r => r.Documents).OrderByDescending(d => d.RelevanceScore),
            totalResults = results.Sum(r => r.TotalResults),
            searchTime = results.Max(r => r.SearchTime)
        });
    }

    [HttpPost("ai/analyze")]
    public async Task<IActionResult> AnalyzeWithAI([FromBody] AIAnalysisRequest request)
    {
        try
        {
            var result = await _openAIService.AnalyzeDocumentAsync(request.Content, request.AnalysisType);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze document with AI");
            return BadRequest(new { error = "AI analysis failed" });
        }
    }

    [HttpPost("notifications/send")]
    public async Task<IActionResult> SendNotification([FromBody] NotificationRequest request)
    {
        var results = new Dictionary<string, bool>();

        foreach (var channel in request.Channels)
        {
            var success = channel.Type switch
            {
                "sms" => await _notificationService.SendSMSAsync(channel.Target, request.Message),
                "slack" => await _notificationService.SendSlackMessageAsync(channel.Target, request.Message),
                "teams" => await _notificationService.SendTeamsMessageAsync(channel.Target, request.Message),
                "push" => await _notificationService.SendPushNotificationAsync(channel.Target, request.Title ?? "MemoLib", request.Message),
                _ => false
            };
            
            results[channel.Type] = success;
        }

        return Ok(new { results });
    }
}

public class EmailSendRequest
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public class SigningEnvelopeRequest
{
    public string DocumentName { get; set; } = string.Empty;
    public string DocumentBase64 { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<SignerRequest> Signers { get; set; } = new();
}

public class SignerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int RoutingOrder { get; set; }
}

public class LegalSearchRequest
{
    public string Query { get; set; } = string.Empty;
    public List<string> Sources { get; set; } = new();
}

public class AIAnalysisRequest
{
    public string Content { get; set; } = string.Empty;
    public AIAnalysisType AnalysisType { get; set; }
}

public class NotificationRequest
{
    public string? Title { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<NotificationChannel> Channels { get; set; } = new();
}

public class NotificationChannel
{
    public string Type { get; set; } = string.Empty; // sms, slack, teams, push
    public string Target { get; set; } = string.Empty; // phone, channel, webhook, token
}