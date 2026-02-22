using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MemoLib.Api.Contracts;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtTokenService> _logger;

    public JwtTokenService(IConfiguration configuration, ILogger<JwtTokenService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public AuthToken GenerateToken(User user)
    {
        var settings = GetJwtSettings();
        var expiresAt = DateTime.UtcNow.AddMinutes(settings.ExpirationMinutes);
        var refreshExpiresAt = DateTime.UtcNow.AddDays(settings.RefreshExpirationDays);

        var accessToken = GenerateJwt(user, expiresAt, settings, "access");
        var refreshToken = GenerateJwt(user, refreshExpiresAt, settings, "refresh");

        _logger.LogInformation("Token généré pour utilisateur: {Email}", user.Email);

        return new AuthToken
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
        };
    }

    public bool ValidateToken(string token, string expectedTokenType = "access")
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, GetTokenValidationParameters(), out _);
            var tokenType = principal.FindFirst("tokenType")?.Value;
            if (!string.Equals(tokenType, expectedTokenType, StringComparison.Ordinal))
            {
                return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    public bool TryValidateRefreshToken(string refreshToken, out ClaimsPrincipal? principal)
    {
        principal = null;

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            principal = tokenHandler.ValidateToken(refreshToken, GetTokenValidationParameters(), out _);
            var tokenType = principal.FindFirst("tokenType")?.Value;
            return string.Equals(tokenType, "refresh", StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }

    private string GenerateJwt(User user, DateTime expiresAt, JwtSettings settings, string tokenType)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("userId", user.Id.ToString()),
            new Claim("createdAt", user.CreatedAt.ToString("O")),
            new Claim("tokenType", tokenType),
        };

        var token = new JwtSecurityToken(
            issuer: settings.Issuer,
            audience: settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private TokenValidationParameters GetTokenValidationParameters()
    {
        var settings = GetJwtSettings();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SecretKey));

        return new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = settings.Issuer,
            ValidateAudience = true,
            ValidAudience = settings.Audience,
            ClockSkew = TimeSpan.Zero
        };
    }

    private JwtSettings GetJwtSettings()
    {
        var secretKey = _configuration["JwtSettings:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
        {
            throw new InvalidOperationException("JwtSettings:SecretKey invalide (>= 32 caractères requis).");
        }

        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];

        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException("JwtSettings:Issuer et JwtSettings:Audience doivent être configurés.");
        }

        return new JwtSettings
        {
            SecretKey = secretKey,
            Issuer = issuer,
            Audience = audience,
            ExpirationMinutes = int.Parse(_configuration["JwtSettings:ExpirationMinutes"] ?? "60"),
            RefreshExpirationDays = int.Parse(_configuration["JwtSettings:RefreshExpirationDays"] ?? "7")
        };
    }

    private sealed class JwtSettings
    {
        public string SecretKey { get; init; } = null!;
        public string Issuer { get; init; } = null!;
        public string Audience { get; init; } = null!;
        public int ExpirationMinutes { get; init; }
        public int RefreshExpirationDays { get; init; }
    }
}
