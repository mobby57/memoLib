using MemoLib.Api.Models;
using MemoLib.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Tests;

public class ExportServiceTests
{
    [Fact]
    public async Task ExportCaseAsync_Json_ReturnsJsonData()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var caseEntity = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Export",
            Status = "OPEN",
            Priority = 3,
            CreatedAt = DateTime.UtcNow
        };
        db.Cases.Add(caseEntity);
        await db.SaveChangesAsync();

        var sut = new ExportService(db);
        var (data, contentType, fileName) = await sut.ExportCaseAsync(caseEntity.Id, userId, "json");

        Assert.NotEmpty(data);
        Assert.Equal("application/json", contentType);
        Assert.Contains(".json", fileName);
    }

    [Fact]
    public async Task ExportCaseAsync_Csv_ReturnsCsvData()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var caseEntity = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test CSV",
            CreatedAt = DateTime.UtcNow
        };
        db.Cases.Add(caseEntity);
        await db.SaveChangesAsync();

        var sut = new ExportService(db);
        var (data, contentType, _) = await sut.ExportCaseAsync(caseEntity.Id, userId, "csv");

        Assert.NotEmpty(data);
        Assert.Equal("text/csv", contentType);
    }

    [Fact]
    public async Task ExportCaseAsync_UnknownFormat_Throws()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Cases.Add(new Case { Id = Guid.NewGuid(), UserId = userId, Title = "X", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var sut = new ExportService(db);
        var caseId = await db.Cases.Select(c => c.Id).FirstAsync();

        await Assert.ThrowsAsync<Exception>(() => sut.ExportCaseAsync(caseId, userId, "xml"));
    }

    [Fact]
    public async Task ExportCaseAsync_WrongUser_Throws()
    {
        var db = TestDbContextFactory.Create();
        var caseEntity = new Case
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Title = "Autre user",
            CreatedAt = DateTime.UtcNow
        };
        db.Cases.Add(caseEntity);
        await db.SaveChangesAsync();

        var sut = new ExportService(db);
        await Assert.ThrowsAsync<Exception>(() => sut.ExportCaseAsync(caseEntity.Id, Guid.NewGuid(), "json"));
    }
}

public class CaseModelTests
{
    [Fact]
    public void Case_DefaultStatus_IsOpen()
    {
        var c = new Case();
        Assert.Equal("OPEN", c.Status);
    }

    [Fact]
    public void Case_DefaultPriority_IsZero()
    {
        var c = new Case();
        Assert.Equal(0, c.Priority);
    }
}

public class RefreshTokenModelTests
{
    [Fact]
    public void IsActive_NotRevokedNotExpired_ReturnsTrue()
    {
        var token = new RefreshToken
        {
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            RevokedAt = null
        };
        Assert.True(token.IsActive);
    }

    [Fact]
    public void IsActive_Revoked_ReturnsFalse()
    {
        var token = new RefreshToken
        {
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            RevokedAt = DateTime.UtcNow
        };
        Assert.False(token.IsActive);
    }

    [Fact]
    public void IsActive_Expired_ReturnsFalse()
    {
        var token = new RefreshToken
        {
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            RevokedAt = null
        };
        Assert.False(token.IsActive);
    }
}
