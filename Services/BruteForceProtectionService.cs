using Microsoft.Extensions.Caching.Memory;

namespace MemoLib.Api.Services;

public class BruteForceProtectionService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<BruteForceProtectionService> _logger;

    private const int MaxAttemptsPerUser = 5;
    private const int MaxAttemptsPerIp = 20;
    private const int LockoutMinutesUser = 5;
    private const int LockoutMinutesIp = 15;

    public BruteForceProtectionService(IMemoryCache cache, ILogger<BruteForceProtectionService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public Task<bool> IsLockedOutAsync(string ip, string? email = null)
    {
        // Vérifier lockout par IP+Email (prioritaire)
        if (!string.IsNullOrEmpty(email))
        {
            var userKey = $"lockout_user_{ip}_{email.ToLowerInvariant()}";
            var userLockout = _cache.Get<DateTime?>(userKey);
            if (userLockout > DateTime.UtcNow)
            {
                _logger.LogWarning("Accès bloqué pour {Email} depuis {IP} (lockout utilisateur)", email, ip);
                return Task.FromResult(true);
            }
        }

        // Vérifier lockout global IP (seuil beaucoup plus haut)
        var ipKey = $"lockout_ip_{ip}";
        var ipLockout = _cache.Get<DateTime?>(ipKey);
        if (ipLockout > DateTime.UtcNow)
        {
            _logger.LogWarning("Accès bloqué pour IP {IP} (lockout global)", ip);
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    // Surcharge rétrocompatible (IP seule)
    public Task<bool> IsLockedOutAsync(string identifier)
        => IsLockedOutAsync(identifier, null);

    public Task RecordFailedAttemptAsync(string ip, string? email = null)
    {
        // Compteur par IP+Email
        if (!string.IsNullOrEmpty(email))
        {
            var normalizedEmail = email.ToLowerInvariant();
            var userAttemptsKey = $"attempts_user_{ip}_{normalizedEmail}";
            var attempts = _cache.Get<int>(userAttemptsKey) + 1;
            _cache.Set(userAttemptsKey, attempts, TimeSpan.FromMinutes(LockoutMinutesUser));

            if (attempts >= MaxAttemptsPerUser)
            {
                var lockoutKey = $"lockout_user_{ip}_{normalizedEmail}";
                _cache.Set(lockoutKey, DateTime.UtcNow.AddMinutes(LockoutMinutesUser), TimeSpan.FromMinutes(LockoutMinutesUser));
                _logger.LogWarning("Lockout utilisateur: {Email} depuis {IP} après {N} tentatives ({Min}min)", normalizedEmail, ip, attempts, LockoutMinutesUser);
            }
        }

        // Compteur global par IP (seuil haut pour éviter faux positifs cabinet)
        var ipAttemptsKey = $"attempts_ip_{ip}";
        var ipAttempts = _cache.Get<int>(ipAttemptsKey) + 1;
        _cache.Set(ipAttemptsKey, ipAttempts, TimeSpan.FromMinutes(LockoutMinutesIp));

        if (ipAttempts >= MaxAttemptsPerIp)
        {
            var ipLockoutKey = $"lockout_ip_{ip}";
            _cache.Set(ipLockoutKey, DateTime.UtcNow.AddMinutes(LockoutMinutesIp), TimeSpan.FromMinutes(LockoutMinutesIp));
            _logger.LogWarning("Lockout IP global: {IP} après {N} tentatives ({Min}min)", ip, ipAttempts, LockoutMinutesIp);
        }

        return Task.CompletedTask;
    }

    // Surcharge rétrocompatible
    public Task RecordFailedAttemptAsync(string identifier)
        => RecordFailedAttemptAsync(identifier, null);

    public Task RecordSuccessfulLoginAsync(string ip, string? email = null)
    {
        if (!string.IsNullOrEmpty(email))
        {
            var normalizedEmail = email.ToLowerInvariant();
            _cache.Remove($"attempts_user_{ip}_{normalizedEmail}");
            _cache.Remove($"lockout_user_{ip}_{normalizedEmail}");
        }

        // Ne PAS reset le compteur IP global (un login réussi d'un user ne doit pas débloquer les autres)
        return Task.CompletedTask;
    }

    // Surcharge rétrocompatible
    public Task RecordSuccessfulLoginAsync(string identifier)
        => RecordSuccessfulLoginAsync(identifier, null);
}
