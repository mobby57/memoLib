using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class ClientInfoExtractor
{
    private static readonly Regex PhoneRegex = new(
        @"(?:Tel|Tél|Phone|Mobile|Portable|Contact)\s*:?\s*([+\d\s\(\)\-\.]{10,20})",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex AddressRegex = new(
        @"(?:Adresse|Address|Domicile)\s*:?\s*([^\n\r]{15,150})",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex CompanyRegex = new(
        @"(?:Société|Company|Entreprise)\s*:?\s*([^\n\r]{3,100})",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public string? ExtractPhone(string text)
    {
        var match = PhoneRegex.Match(text);
        if (!match.Success) return null;

        var phone = match.Groups[1].Value.Trim();
        return string.IsNullOrWhiteSpace(phone) ? null : phone;
    }

    public string? ExtractAddress(string text)
    {
        var match = AddressRegex.Match(text);
        if (!match.Success) return null;

        var address = match.Groups[1].Value.Trim();
        return string.IsNullOrWhiteSpace(address) ? null : address;
    }

    public string? ExtractCompany(string text)
    {
        var match = CompanyRegex.Match(text);
        if (!match.Success) return null;

        var company = match.Groups[1].Value.Trim();
        return string.IsNullOrWhiteSpace(company) ? null : company;
    }

    public string NormalizeName(string? name, string email)
    {
        if (!string.IsNullOrWhiteSpace(name))
            return name.Trim();

        var localPart = email.Split('@')[0];
        return localPart.Replace('.', ' ').Replace('_', ' ').Trim();
    }
}
