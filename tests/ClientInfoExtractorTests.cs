using MemoLib.Api.Services;

namespace MemoLib.Tests;

public class ClientInfoExtractorTests
{
    private readonly ClientInfoExtractor _sut = new();

    [Theory]
    [InlineData("Tel: 06 12 34 56 78", "06 12 34 56 78")]
    [InlineData("Mobile : +33612345678", "+33612345678")]
    [InlineData("Portable: 07.12.34.56.78", "07.12.34.56.78")]
    public void ExtractPhone_ValidFormats_ReturnsPhone(string text, string expected)
    {
        var result = _sut.ExtractPhone(text);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Bonjour, je vous contacte pour un divorce")]
    [InlineData("")]
    public void ExtractPhone_NoPhone_ReturnsNull(string text)
    {
        Assert.Null(_sut.ExtractPhone(text));
    }

    [Fact]
    public void ExtractAddress_ValidFormat_ReturnsAddress()
    {
        var text = "Adresse : 12 rue de la Paix, 75002 Paris";
        var result = _sut.ExtractAddress(text);
        Assert.Equal("12 rue de la Paix, 75002 Paris", result);
    }

    [Fact]
    public void ExtractAddress_NoAddress_ReturnsNull()
    {
        Assert.Null(_sut.ExtractAddress("Bonjour"));
    }

    [Fact]
    public void ExtractCompany_ValidFormat_ReturnsCompany()
    {
        var text = "Société : SARL Dupont & Fils";
        var result = _sut.ExtractCompany(text);
        Assert.Equal("SARL Dupont & Fils", result);
    }

    [Theory]
    [InlineData("Jean Dupont", "jean@test.com", "Jean Dupont")]
    [InlineData("  Marie  ", "marie@test.com", "Marie")]
    [InlineData(null, "jean.dupont@test.com", "jean dupont")]
    [InlineData("", "marie_martin@test.com", "marie martin")]
    public void NormalizeName_ReturnsExpected(string? name, string email, string expected)
    {
        Assert.Equal(expected, _sut.NormalizeName(name, email));
    }
}
