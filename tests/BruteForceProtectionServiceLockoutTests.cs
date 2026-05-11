using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using MemoLib.Api.Services;
using Xunit;

public class BruteForceProtectionServiceLockoutTests
{
    [Fact]
    public async Task UserLockout_Triggers_After_MaxAttempts()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = new NullLogger<BruteForceProtectionService>();
        var service = new BruteForceProtectionService(cache, logger);

        var ip = "127.0.0.1";
        var email = "lockoutuser@example.com";

        // perform more than MaxAttemptsPerUser (5) failed attempts
        for (int i = 0; i < 7; i++)
        {
            await service.RecordFailedAttemptAsync(ip, email);
        }

        var locked = await service.IsLockedOutAsync(ip, email);
        Assert.True(locked, "User should be locked out after multiple failed attempts");

        var delay = await service.GetDelayForFailedAttemptAsync(ip, email);
        Assert.True(delay >= TimeSpan.FromMinutes(5), $"Expected delay >= 5min but was {delay}");
    }

    [Fact]
    public async Task IpLockout_Triggers_After_MaxAttempts()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = new NullLogger<BruteForceProtectionService>();
        var service = new BruteForceProtectionService(cache, logger);

        var ip = "192.0.2.1";

        // perform more than MaxAttemptsPerIp (20) failed attempts
        for (int i = 0; i < 22; i++)
        {
            await service.RecordFailedAttemptAsync(ip);
        }

        var locked = await service.IsLockedOutAsync(ip);
        Assert.True(locked, "IP should be locked out after many failed attempts");

        var delay = await service.GetDelayForFailedAttemptAsync(ip);
        Assert.True(delay >= TimeSpan.FromMinutes(15), $"Expected delay >= 15min but was {delay}");
    }
}
