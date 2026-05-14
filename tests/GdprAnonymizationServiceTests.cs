using MemoLib.Api.Services;

namespace MemoLib.Tests;

public class GdprAnonymizationServiceTests
{
    private readonly GdprAnonymizationService _sut = new();

    [Fact]
    public void AnonymizeClientData_AnonymizesEmails()
    {
        var text = "Contact: jean.dupont@gmail.com pour le dossier.";
        var result = _sut.AnonymizeClientData(text);

        Assert.DoesNotContain("jean.dupont@gmail.com", result.AnonymizedText);
        Assert.Contains("@anonymized.local", result.AnonymizedText);
        Assert.Contains("jean.dupont@gmail.com", result.OriginalDataMappings.Keys);
    }

    [Fact]
    public void AnonymizeClientData_AnonymizesPhoneNumbers()
    {
        var text = "Appelez le 06 12 34 56 78 ou le +33612345678.";
        var result = _sut.AnonymizeClientData(text);

        Assert.DoesNotContain("06 12 34 56 78", result.AnonymizedText);
        Assert.DoesNotContain("+33612345678", result.AnonymizedText);
    }

    [Fact]
    public void AnonymizeClientData_AnonymizesNames()
    {
        var text = "Le client Jean Dupont a déposé une demande.";
        var result = _sut.AnonymizeClientData(text);

        Assert.DoesNotContain("Jean Dupont", result.AnonymizedText);
        Assert.Contains("Jean Dupont", result.OriginalDataMappings.Keys);
    }

    [Fact]
    public void AnonymizeClientData_PreservesNonPII()
    {
        var text = "Le dossier OQTF est en cours d'instruction au tribunal administratif.";
        var result = _sut.AnonymizeClientData(text);

        Assert.Contains("OQTF", result.AnonymizedText);
        Assert.Contains("tribunal administratif", result.AnonymizedText);
    }

    [Fact]
    public void AnonymizeClientData_SetsAnonymizationDate()
    {
        var result = _sut.AnonymizeClientData("test@test.com");

        Assert.True(result.AnonymizationDate <= DateTime.UtcNow);
        Assert.True(result.AnonymizationDate > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public void AnonymizeClientData_SetsClientReference()
    {
        var result = _sut.AnonymizeClientData("test", "CLIENT-123");
        Assert.Equal("CLIENT-123", result.ClientReference);
    }

    [Fact]
    public void AnonymizeClientData_GeneratesClientReferenceWhenNull()
    {
        var result = _sut.AnonymizeClientData("test");
        Assert.False(string.IsNullOrWhiteSpace(result.ClientReference));
    }

    [Fact]
    public void GenerateConsistentHash_SameInputSameOutput()
    {
        var hash1 = _sut.GenerateConsistentHash("test@example.com");
        var hash2 = _sut.GenerateConsistentHash("test@example.com");
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void GenerateConsistentHash_DifferentInputDifferentOutput()
    {
        var hash1 = _sut.GenerateConsistentHash("alice@example.com");
        var hash2 = _sut.GenerateConsistentHash("bob@example.com");
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void GenerateConsistentHash_Returns12CharHex()
    {
        var hash = _sut.GenerateConsistentHash("test");
        Assert.Equal(12, hash.Length);
        Assert.Matches("^[0-9a-f]+$", hash);
    }

    [Fact]
    public void GenerateComplianceReport_ReturnsValidReport()
    {
        var userId = Guid.NewGuid();
        var report = _sut.GenerateComplianceReport(userId);

        Assert.Equal(userId, report.UserId);
        Assert.True(report.GeneratedAt <= DateTime.UtcNow);
        Assert.NotEmpty(report.DataCategories);
        Assert.NotEmpty(report.AnonymizationMethods);
    }

    [Fact]
    public void GenerateComplianceReport_IncludesRequiredCategories()
    {
        var report = _sut.GenerateComplianceReport(Guid.NewGuid());
        var names = report.DataCategories.Select(c => c.Name).ToList();

        Assert.Contains("Emails clients", names);
        Assert.Contains("Dossiers juridiques", names);
        Assert.Contains("Audit logs", names);
    }

    [Fact]
    public void AnonymizeClientData_HandlesEmptyString()
    {
        var result = _sut.AnonymizeClientData("");
        Assert.Equal("", result.AnonymizedText);
        Assert.Empty(result.OriginalDataMappings);
    }

    [Fact]
    public void AnonymizeClientData_HandlesMultiplePIIInSameText()
    {
        var text = "Jean Dupont (jean.dupont@gmail.com, 06 11 22 33 44) habite Paris.";
        var result = _sut.AnonymizeClientData(text);

        Assert.DoesNotContain("jean.dupont@gmail.com", result.AnonymizedText);
        Assert.DoesNotContain("Jean Dupont", result.AnonymizedText);
        Assert.True(result.OriginalDataMappings.Count >= 2);
    }
}
