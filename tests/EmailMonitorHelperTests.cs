using System.Security.Cryptography;
using System.Text;

namespace MemoLib.Tests;

/// <summary>
/// Tests for EmailMonitorService helper logic.
/// The BackgroundService itself requires IMAP, so we test the pure functions.
/// </summary>
public class EmailMonitorHelperTests
{
    [Fact]
    public void ComputeSHA256_SameInput_SameHash()
    {
        var hash1 = ComputeSHA256("Hello World");
        var hash2 = ComputeSHA256("Hello World");
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void ComputeSHA256_DifferentInput_DifferentHash()
    {
        var hash1 = ComputeSHA256("Email A");
        var hash2 = ComputeSHA256("Email B");
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void ComputeSHA256_EmptyString_ReturnsHash()
    {
        var hash = ComputeSHA256("");
        Assert.False(string.IsNullOrWhiteSpace(hash));
        Assert.Equal(64, hash.Length); // SHA256 hex = 64 chars
    }

    [Fact]
    public void ComputeSHA256_NullInput_ReturnsHashOfEmpty()
    {
        var hashNull = ComputeSHA256(null);
        var hashEmpty = ComputeSHA256("");
        Assert.Equal(hashNull, hashEmpty);
    }

    [Theory]
    [InlineData("noreply@spam.com", new[] { "spam.com", "noreply" }, true)]
    [InlineData("client@cabinet.fr", new[] { "spam.com", "noreply" }, false)]
    [InlineData("NOREPLY@SPAM.COM", new[] { "spam.com" }, true)]
    [InlineData("user@example.com", new string[0], false)]
    public void IsBlacklisted_MatchesCorrectly(string from, string[] blacklist, bool expected)
    {
        var result = blacklist.Any(b => from.Contains(b, StringComparison.OrdinalIgnoreCase));
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("client@cabinet.fr", new[] { "cabinet.fr" }, true)]
    [InlineData("client@cabinet.fr", new[] { "other.com" }, false)]
    [InlineData("client@cabinet.fr", null, true)] // null whitelist = allow all
    public void IsWhitelisted_MatchesCorrectly(string from, string[]? whitelist, bool expected)
    {
        var result = whitelist == null || whitelist.Length == 0 ||
                     whitelist.Any(w => from.Contains(w, StringComparison.OrdinalIgnoreCase));
        Assert.Equal(expected, result);
    }

    [Fact]
    public void BuildSignalRelayEmailText_TruncatesLongBody()
    {
        var longBody = new string('A', 2000);
        var result = BuildSignalRelayEmailText("Subject", longBody);

        Assert.Contains("Subject", result);
        Assert.True(result.Length < 1300);
        Assert.EndsWith("...", result);
    }

    [Fact]
    public void BuildSignalRelayEmailText_HandlesEmptySubject()
    {
        var result = BuildSignalRelayEmailText("", "Body content");
        Assert.Contains("(sans objet)", result);
    }

    [Fact]
    public void BuildSignalRelayEmailText_HandlesEmptyBody()
    {
        var result = BuildSignalRelayEmailText("Subject", "");
        Assert.Contains("(contenu vide)", result);
    }

    [Fact]
    public void BuildSignalRelayEmailText_NormalEmail()
    {
        var result = BuildSignalRelayEmailText("Demande de RDV", "Bonjour, je souhaite un rendez-vous.");
        Assert.Contains("Objet: Demande de RDV", result);
        Assert.Contains("Bonjour, je souhaite un rendez-vous.", result);
    }

    [Theory]
    [InlineData("spf=fail", "", true)]
    [InlineData("spf=softfail", "", true)]
    [InlineData("", "dkim=fail", true)]
    [InlineData("spf=pass", "dkim=pass", false)]
    [InlineData("", "", false)]
    public void DetectSpoofing_ChecksSpfDkim(string spfResult, string dkimResult, bool expectedSuspect)
    {
        var authResult = $"{spfResult} {dkimResult}";
        var spfFail = authResult.Contains("spf=fail", StringComparison.OrdinalIgnoreCase)
                   || authResult.Contains("spf=softfail", StringComparison.OrdinalIgnoreCase);
        var dkimFail = authResult.Contains("dkim=fail", StringComparison.OrdinalIgnoreCase);

        Assert.Equal(expectedSuspect, spfFail || dkimFail);
    }

    // Mirror of EmailMonitorService private methods for testing
    private static string ComputeSHA256(string? input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? ""));
        return Convert.ToHexString(bytes);
    }

    private static string BuildSignalRelayEmailText(string subject, string body)
    {
        var safeSubject = string.IsNullOrWhiteSpace(subject) ? "(sans objet)" : subject.Trim();
        var safeBody = string.IsNullOrWhiteSpace(body) ? "(contenu vide)" : body.Trim();

        if (safeBody.Length > 1200)
            safeBody = safeBody[..1200] + "...";

        return $"Objet: {safeSubject}\n\n{safeBody}";
    }
}
