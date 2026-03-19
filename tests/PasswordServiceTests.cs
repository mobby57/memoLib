using MemoLib.Api.Services;

namespace MemoLib.Tests;

public class PasswordServiceTests
{
    private readonly PasswordService _sut = new();

    [Fact]
    public void HashPassword_ReturnsNonEmptyString()
    {
        var hash = _sut.HashPassword("Test123!");
        Assert.False(string.IsNullOrWhiteSpace(hash));
    }

    [Fact]
    public void HashPassword_ContainsSaltSeparator()
    {
        var hash = _sut.HashPassword("Test123!");
        Assert.Contains('.', hash);
        Assert.Equal(2, hash.Split('.').Length);
    }

    [Fact]
    public void HashPassword_DifferentSaltsEachTime()
    {
        var hash1 = _sut.HashPassword("Test123!");
        var hash2 = _sut.HashPassword("Test123!");
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        var hash = _sut.HashPassword("MonMotDePasse!");
        Assert.True(_sut.VerifyPassword("MonMotDePasse!", hash));
    }

    [Fact]
    public void VerifyPassword_WrongPassword_ReturnsFalse()
    {
        var hash = _sut.HashPassword("MonMotDePasse!");
        Assert.False(_sut.VerifyPassword("MauvaisMotDePasse", hash));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("invalidformat")]
    public void VerifyPassword_InvalidHash_ReturnsFalse(string? storedHash)
    {
        Assert.False(_sut.VerifyPassword("test", storedHash));
    }
}
