using MemoLib.Api.Services;
using MemoLib.Api.Services.Integration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace MemoLib.Tests;

public class EmailClassificationServiceTests
{
    private readonly EmailClassificationService _sut;

    public EmailClassificationServiceTests()
    {
        var openAI = new Mock<IOpenAIService>();
        var logger = new Mock<ILogger<EmailClassificationService>>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EmailClassification:UseAI"] = "false"
            })
            .Build();

        _sut = new EmailClassificationService(openAI.Object, logger.Object, config);
    }

    [Theory]
    [InlineData("Audience tribunal", "", "CONTENTIEUX")]
    [InlineData("Divorce", "garde des enfants", "FAMILLE")]
    [InlineData("Licenciement abusif", "", "TRAVAIL")]
    [InlineData("Facture honoraires", "", "FACTURATION")]
    [InlineData("Rendez-vous consultation", "", "CONSULTATION")]
    [InlineData("Plainte pénale", "", "PENAL")]
    [InlineData("Vente immobilier", "", "IMMOBILIER")]
    [InlineData("Statuts SARL", "", "CORPORATE")]
    [InlineData("Bonjour", "Comment allez-vous", "GENERAL")]
    public async Task ClassifyAsync_RulesBased_ReturnsCorrectCategory(string subject, string body, string expected)
    {
        var result = await _sut.ClassifyAsync("test@test.com", subject, body);
        Assert.Equal(expected, result.Category);
    }

    [Theory]
    [InlineData("URGENT: audience demain", "CRITICAL")]
    [InlineData("Rapidement SVP", "HIGH")]
    [InlineData("Quand vous pourrez", "LOW")]
    [InlineData("Bonjour", "NORMAL")]
    public async Task ClassifyAsync_DetectsUrgency(string subject, string expectedUrgency)
    {
        var result = await _sut.ClassifyAsync("test@test.com", subject, "");
        Assert.Equal(expectedUrgency, result.Urgency);
    }

    [Fact]
    public async Task ClassifyAsync_ExtractsTags()
    {
        var result = await _sut.ClassifyAsync("test@test.com", "Urgent divorce", "garde des enfants");
        Assert.Contains("urgent", result.SuggestedTags);
        Assert.Contains("famille", result.SuggestedTags);
    }

    [Fact]
    public async Task ClassifyAsync_ComputesPriority()
    {
        var result = await _sut.ClassifyAsync("test@test.com", "URGENT audience tribunal", "");
        Assert.True(result.SuggestedPriority >= 3);
    }
}
