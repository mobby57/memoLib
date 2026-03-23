using MemoLib.Api.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace MemoLib.Tests;

public class RedisCacheServiceTests
{
    private readonly RedisCacheService _sut;

    public RedisCacheServiceTests()
    {
        var memoryCache = new MemoryDistributedCache(
            Options.Create(new MemoryDistributedCacheOptions()));
        var logger = new Mock<ILogger<RedisCacheService>>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        _sut = new RedisCacheService(memoryCache, logger.Object, config);
    }

    [Fact]
    public async Task SetAndGet_ReturnsStoredValue()
    {
        await _sut.SetAsync("test-key", new TestData { Name = "Hello" });
        var result = await _sut.GetAsync<TestData>("test-key");

        Assert.NotNull(result);
        Assert.Equal("Hello", result.Name);
    }

    [Fact]
    public async Task Get_NonExistentKey_ReturnsNull()
    {
        var result = await _sut.GetAsync<TestData>("non-existent");
        Assert.Null(result);
    }

    [Fact]
    public async Task Remove_DeletesKey()
    {
        await _sut.SetAsync("to-remove", new TestData { Name = "Remove me" });
        await _sut.RemoveAsync("to-remove");
        var result = await _sut.GetAsync<TestData>("to-remove");
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOrSet_CacheMiss_CallsFactory()
    {
        var callCount = 0;
        var result = await _sut.GetOrSetAsync("factory-key", () =>
        {
            callCount++;
            return Task.FromResult(new TestData { Name = "FromFactory" });
        });

        Assert.Equal("FromFactory", result.Name);
        Assert.Equal(1, callCount);

        // Second call should use cache
        var result2 = await _sut.GetOrSetAsync("factory-key", () =>
        {
            callCount++;
            return Task.FromResult(new TestData { Name = "ShouldNotBeCalled" });
        });

        Assert.Equal("FromFactory", result2.Name);
        Assert.Equal(1, callCount);
    }

    [Fact]
    public void IsRedisActive_NoConfig_ReturnsFalse()
    {
        Assert.False(_sut.IsRedisActive);
    }

    private class TestData
    {
        public string Name { get; set; } = string.Empty;
    }
}
