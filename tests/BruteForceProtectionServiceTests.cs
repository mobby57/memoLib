using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using MemoLib.Api.Services;
using Xunit;

public class BruteForceProtectionServiceTests
{
    [Fact]
    public async Task GetDelay_Increases_After_FailedAttempts()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = new NullLogger<BruteForceProtectionService>();
        var service = new BruteForceProtectionService(cache, logger);

        var identifier = "testuser@example.com_127.0.0.1";

        // initial delay should be zero
        var initial = await service.GetDelayForFailedAttemptAsync(identifier);
        Assert.Equal(TimeSpan.Zero, initial);

        // one failed attempt -> still small or zero
        await service.RecordFailedAttemptAsync(identifier);
        var after1 = await service.GetDelayForFailedAttemptAsync(identifier);
        Assert.True(after1 >= TimeSpan.Zero);

        // several failed attempts -> delay should increase
        for (int i = 0; i < 4; i++) await service.RecordFailedAttemptAsync(identifier);
        var afterMany = await service.GetDelayForFailedAttemptAsync(identifier);
        Assert.True(afterMany > TimeSpan.Zero);
    }
}
