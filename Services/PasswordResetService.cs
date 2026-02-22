using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class PasswordResetService
{
    private readonly MemoLibDbContext _context;
    private readonly ILogger<PasswordResetService> _logger;
    private readonly TimeSpan _tokenExpiry = TimeSpan.FromHours(1);

    public PasswordResetService(MemoLibDbContext context, ILogger<PasswordResetService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string> GenerateResetTokenAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        
        if (user == null)
        {
            // Ne pas révéler si l'utilisateur existe
            _logger.LogWarning("Tentative de reset pour email inexistant: {Email}", normalizedEmail);
            return string.Empty;
        }

        // Générer un token sécurisé
        var tokenBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var token = Convert.ToBase64String(tokenBytes);

        // Stocker le token avec expiration
        var resetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.Add(_tokenExpiry),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Token de reset généré pour: {Email}", normalizedEmail);
        return token;
    }

    public async Task<bool> ValidateAndResetPasswordAsync(string token, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
            return false;

        var resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(rt => rt.Token == token && !rt.IsUsed && rt.ExpiresAt > DateTime.UtcNow);

        if (resetToken == null)
        {
            _logger.LogWarning("Token de reset invalide ou expiré: {Token}", token);
            return false;
        }

        // Valider le nouveau mot de passe
        if (!IsPasswordValid(newPassword))
        {
            _logger.LogWarning("Nouveau mot de passe invalide pour user: {UserId}", resetToken.UserId);
            return false;
        }

        // Marquer le token comme utilisé
        resetToken.IsUsed = true;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == resetToken.UserId);
        if (user == null)
        {
            _logger.LogWarning("Utilisateur introuvable pour token de reset: {UserId}", resetToken.UserId);
            return false;
        }

        // Mettre à jour le mot de passe
        var passwordService = new PasswordService();
        user.Password = passwordService.HashPassword(newPassword);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Mot de passe réinitialisé pour user: {UserId}", resetToken.UserId);
        return true;
    }

    private static bool IsPasswordValid(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            return false;

        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);

        return hasUpper && hasLower && hasDigit;
    }

    public async Task CleanupExpiredTokensAsync()
    {
        var expiredTokens = await _context.PasswordResetTokens
            .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        _context.PasswordResetTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Nettoyage de {Count} tokens expirés", expiredTokens.Count);
    }
}