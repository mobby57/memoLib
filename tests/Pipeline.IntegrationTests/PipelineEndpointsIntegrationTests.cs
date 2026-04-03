using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MemoLib.Api.Contracts;

namespace MemoLib.Pipeline.IntegrationTests;

public class PipelineEndpointsIntegrationTests : IClassFixture<PipelineApiFactory>
{
    private readonly HttpClient _client;
    private static readonly string TenantId = Guid.NewGuid().ToString("N");

    public PipelineEndpointsIntegrationTests(PipelineApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Analyze_ReturnsBadRequest_WhenRequiredFieldsMissing()
    {
        var response = await _client.PostAsJsonAsync("/api/pipeline/analyze", new { });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Analyze_ReturnsClassification_WhenPayloadIsValid()
    {
        var payload = new AnalyzeEmailRequest
        {
            TenantId = TenantId,
            EmailId = Guid.NewGuid().ToString("N"),
            Subject = "Urgent OQTF dossier",
            Body = "Delai urgent pour recours",
            SourceProvider = "mailkit",
        };

        var response = await _client.PostAsJsonAsync("/api/pipeline/analyze", payload);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<AnalyzeEmailResponse>();
        Assert.NotNull(body);
        Assert.Equal(payload.EmailId, body!.EmailId);
        Assert.Equal("CONTENTIEUX_OQTF", body.Category);
        Assert.Equal("high", body.Urgency);
        Assert.True(body.RequiresHumanReview);
    }

    [Fact]
    public async Task WorkflowStart_ReturnsExecutionId_AndReceivedState()
    {
        var payload = new StartWorkflowRequest
        {
            TenantId = TenantId,
            EmailId = Guid.NewGuid().ToString("N"),
            WorkflowName = "email-triage",
        };

        var response = await _client.PostAsJsonAsync("/api/pipeline/workflows/start", payload);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<StartWorkflowResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.ExecutionId));
        Assert.Equal("RECEIVED", body.State);

        var detailsResponse = await _client.GetAsync($"/api/pipeline/workflows/{body.ExecutionId}?tenantId={TenantId}");
        detailsResponse.EnsureSuccessStatusCode();

        var details = await detailsResponse.Content.ReadFromJsonAsync<WorkflowExecutionDetailsResponse>();
        Assert.NotNull(details);
        Assert.Equal("RECEIVED", details!.State);
        Assert.Single(details.Transitions);
        Assert.Equal("RECEIVED", details.Transitions[0].ToState);
    }

    [Fact]
    public async Task Review_ReturnsBadRequest_WhenDecisionInvalid()
    {
        var startPayload = new StartWorkflowRequest
        {
            TenantId = TenantId,
            EmailId = Guid.NewGuid().ToString("N"),
            WorkflowName = "email-triage",
        };

        var startResponse = await _client.PostAsJsonAsync("/api/pipeline/workflows/start", startPayload);
        startResponse.EnsureSuccessStatusCode();
        var started = await startResponse.Content.ReadFromJsonAsync<StartWorkflowResponse>();

        var payload = new ReviewDecisionRequest
        {
            TenantId = TenantId,
            EmailId = Guid.NewGuid().ToString("N"),
            ExecutionId = started!.ExecutionId,
            Decision = "MAYBE",
            ReviewedByUserId = Guid.NewGuid().ToString("N"),
        };

        var response = await _client.PostAsJsonAsync("/api/pipeline/reviews", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_ReturnsItems_RespectingLimit()
    {
        var payload = new SearchGlobalRequest
        {
            TenantId = TenantId,
            Query = "oqtf",
            Sources = ["email", "dossier"],
            Limit = 1,
        };

        var response = await _client.PostAsJsonAsync("/api/pipeline/search", payload);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<SearchGlobalResponse>();
        Assert.NotNull(body);
        Assert.True(body!.Count <= 1);
        Assert.True(body.Items.Count <= 1);
    }

    [Fact]
    public async Task Review_Approve_PersistsTransitionAndCaseLink()
    {
        var startPayload = new StartWorkflowRequest
        {
            TenantId = TenantId,
            EmailId = Guid.NewGuid().ToString("N"),
            WorkflowName = "email-triage",
        };

        var startResponse = await _client.PostAsJsonAsync("/api/pipeline/workflows/start", startPayload);
        startResponse.EnsureSuccessStatusCode();
        var started = await startResponse.Content.ReadFromJsonAsync<StartWorkflowResponse>();

        var reviewPayload = new ReviewDecisionRequest
        {
            TenantId = TenantId,
            EmailId = startPayload.EmailId,
            ExecutionId = started!.ExecutionId,
            Decision = "APPROVE",
            ReviewedByUserId = Guid.NewGuid().ToString("N"),
            Notes = "validated-by-reviewer",
        };

        var reviewResponse = await _client.PostAsJsonAsync("/api/pipeline/reviews", reviewPayload);
        reviewResponse.EnsureSuccessStatusCode();

        var review = await reviewResponse.Content.ReadFromJsonAsync<ReviewDecisionResponse>();
        Assert.NotNull(review);
        Assert.Equal("RECEIVED", review!.PreviousState);
        Assert.Equal("APPROVED", review.NewState);
        Assert.True(review.DossierUpdated);
        Assert.False(string.IsNullOrWhiteSpace(review.DossierId));

        var detailsResponse = await _client.GetAsync($"/api/pipeline/workflows/{started.ExecutionId}?tenantId={TenantId}");
        detailsResponse.EnsureSuccessStatusCode();

        var details = await detailsResponse.Content.ReadFromJsonAsync<WorkflowExecutionDetailsResponse>();
        Assert.NotNull(details);
        Assert.Equal("APPROVED", details!.State);
        Assert.Equal(review.DossierId, details.DossierId);
        Assert.True(details.Transitions.Count >= 2);
        Assert.Equal("APPROVED", details.Transitions[^1].ToState);
        Assert.Equal("human", details.Transitions[^1].ActorType);
    }

    [Fact]
    public async Task WorkflowList_ReturnsPagedExecutions_ForTenant()
    {
        for (var i = 0; i < 2; i++)
        {
            var startPayload = new StartWorkflowRequest
            {
                TenantId = TenantId,
                EmailId = Guid.NewGuid().ToString("N"),
                WorkflowName = "email-triage",
            };

            var startResponse = await _client.PostAsJsonAsync("/api/pipeline/workflows/start", startPayload);
            startResponse.EnsureSuccessStatusCode();
        }

        var listResponse = await _client.GetAsync($"/api/pipeline/workflows?tenantId={TenantId}&limit=1&offset=0");
        listResponse.EnsureSuccessStatusCode();

        var list = await listResponse.Content.ReadFromJsonAsync<WorkflowExecutionListResponse>();
        Assert.NotNull(list);
        Assert.Equal(1, list!.Count);
        Assert.True(list.HasMore);
        Assert.Single(list.Items);
        Assert.Equal("email-triage", list.Items[0].WorkflowName);
    }
}

public sealed class PipelineApiFactory : WebApplicationFactory<Program>
{
    public PipelineApiFactory()
    {
        Environment.SetEnvironmentVariable("JwtSettings__SecretKey", "0123456789abcdef0123456789abcdef");
        Environment.SetEnvironmentVariable("JwtSettings__Issuer", "MemoLib.Test");
        Environment.SetEnvironmentVariable("JwtSettings__Audience", "MemoLib.Test.Client");
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", "Data Source=memolib-pipeline-tests.db");
        Environment.SetEnvironmentVariable("UseSqlServer", "false");
        Environment.SetEnvironmentVariable("DisableHttpsRedirection", "true");
        Environment.SetEnvironmentVariable("SkipDatabaseInitialization", "true");
        Environment.SetEnvironmentVariable("DisableConnectionValidation", "true");
        Environment.SetEnvironmentVariable("EmailClassification__UseAI", "false");
        Environment.SetEnvironmentVariable("SemanticKernel__BaseUrl", "");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "0123456789abcdef0123456789abcdef",
                ["JwtSettings:Issuer"] = "MemoLib.Test",
                ["JwtSettings:Audience"] = "MemoLib.Test.Client",
                ["ConnectionStrings:Default"] = "Data Source=memolib-pipeline-tests.db",
                ["UseSqlServer"] = "false",
                ["DisableHttpsRedirection"] = "true",
                ["SkipDatabaseInitialization"] = "true",
                ["DisableConnectionValidation"] = "true",
                ["EmailClassification:UseAI"] = "false",
                ["SemanticKernel:BaseUrl"] = "",
            });
        });

        builder.ConfigureServices(services =>
        {
            var hostedServices = services
                .Where(service => service.ServiceType == typeof(IHostedService)
                    && service.ImplementationType?.Namespace?.StartsWith("MemoLib.Api.Services") == true)
                .ToList();

            foreach (var hostedService in hostedServices)
            {
                services.Remove(hostedService);
            }
        });
    }
}
