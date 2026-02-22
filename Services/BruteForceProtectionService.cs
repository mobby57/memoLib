using Microsoft.Extensions.Caching.Memory;

namespace MemoLib.Api.Services;

public class BruteForceProtectionService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<BruteForceProtectionService> _logger;
    
    private const int MaxAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int BaseDelayMs = 1000;

    public BruteForceProtectionService(IMemoryCache cache, ILogger<BruteForceProtectionService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public Task<bool> IsLockedOutAsync(string identifier)
    {
        var key = $"lockout_{identifier}";
        var lockoutInfo = _cache.Get<LockoutInfo>(key);
        
        if (lockoutInfo == null)
            return Task.FromResult(false);

        if (lockoutInfo.LockedUntil > DateTime.UtcNow)
        {
            _logger.LogWarning("Tentative d'accès bloquée pour: {Identifier}", identifier);
            return Task.FromResult(true);
        }

        // Lockout expiré, nettoyer
        _cache.Remove(key);
        return Task.FromResult(false);
    }

    public Task RecordFailedAttemptAsync(string identifier)
    {
        var key = $"attempts_{identifier}";
        var attempts = _cache.Get<int>(key);
        attempts++;

        _cache.Set(key, attempts, TimeSpan.FromMinutes(LockoutMinutes));

        if (attempts >= MaxAttempts)
        {
            var lockoutKey = $"lockout_{identifier}";
            var lockoutInfo = new LockoutInfo
            {
                LockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes),
                AttemptCount = attempts
            };
            
            _cache.Set(lockoutKey, lockoutInfo, TimeSpan.FromMinutes(LockoutMinutes));
            _logger.LogWarning("Compte verrouillé pour: {Identifier} après {Attempts} tentatives", identifier, attempts);
        }
        else
        {
            _logger.LogWarning("Tentative échouée {Attempts}/{MaxAttempts} pour: {Identifier}", attempts, MaxAttempts, identifier);
        }
        return Task.CompletedTask;
    }

    public Task<int> GetDelayForFailedAttemptAsync(string identifier)
    {
        var key = $"attempts_{identifier}";
        var attempts = _cache.Get<int>(key);
        
        // Délai progressif: 1s, 2s, 4s, 8s, 16s
        var delay = BaseDelayMs * (int)Math.Pow(2, Math.Min(attempts - 1, 4));
        return Task.FromResult(Math.Min(delay, 16000)); // Max 16 secondes
    }

    public Task RecordSuccessfulLoginAsync(string identifier)
    {
        var attemptsKey = $"attempts_{identifier}";
        var lockoutKey = $"lockout_{identifier}";
        
        _cache.Remove(attemptsKey);
        _cache.Remove(lockoutKey);
        
        _logger.LogInformation("Connexion réussie, compteurs réinitialisés pour: {Identifier}", identifier);
        return Task.CompletedTask;
    }

    private class LockoutInfo
    {
        public DateTime LockedUntil { get; set; }
        public int AttemptCount { get; set; }
    }
}