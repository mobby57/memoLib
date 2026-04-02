using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class UrlValidationService
{
    private static readonly HashSet<string> AllowedDomains = new()
    {
        "localhost",
        "127.0.0.1",
        "memolib.local"
    };

    private static readonly Regex UrlPattern = new(
        @"^https?://([a-zA-Z0-9.-]+)(:[0-9]+)?(/.*)?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    public bool IsUrlSafe(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        // Vérifier si c'est une URL relative (sûre)
        if (url.StartsWith("/") && !url.StartsWith("//"))
            return true;

        // Vérifier le format de l'URL
        var match = UrlPattern.Match(url);
        if (!match.Success)
            return false;

        var domain = match.Groups[1].Value.ToLowerInvariant();
        
        // Vérifier si le domaine est dans la liste autorisée
        return AllowedDomains.Contains(domain) || 
               domain.EndsWith(".memolib.local") ||
               IsLocalhost(domain);
    }

    private static bool IsLocalhost(string domain)
    {
        return domain == "localhost" || 
               domain == "127.0.0.1" || 
               domain.StartsWith("192.168.") ||
               domain.StartsWith("10.") ||
               domain.StartsWith("172.");
    }

    public string SanitizeUrl(string url)
    {
        if (!IsUrlSafe(url))
            return "/";
        
        return url;
    }

    public bool IsEmailSafe(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}