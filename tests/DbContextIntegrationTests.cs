using MemoLib.Api.Models;

namespace MemoLib.Tests;

public class DbContextIntegrationTests
{
    [Fact]
    public async Task CanCreateAndRetrieveUser()
    {
        var db = TestDbContextFactory.Create();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@memolib.local",
            Name = "Test User",
            Role = "AGENT",
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var retrieved = await db.Users.FindAsync(user.Id);
        Assert.NotNull(retrieved);
        Assert.Equal("test@memolib.local", retrieved.Email);
    }

    [Fact]
    public async Task CanCreateCaseWithClient()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();

        var client = new Client
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Jean Dupont",
            Email = "jean@test.com",
            CreatedAt = DateTime.UtcNow
        };

        var caseEntity = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ClientId = client.Id,
            Title = "Divorce Dupont",
            Status = "OPEN",
            Priority = 3,
            CreatedAt = DateTime.UtcNow
        };

        db.Clients.Add(client);
        db.Cases.Add(caseEntity);
        await db.SaveChangesAsync();

        var retrieved = await db.Cases.FindAsync(caseEntity.Id);
        Assert.NotNull(retrieved);
        Assert.Equal("Divorce Dupont", retrieved.Title);
        Assert.Equal(client.Id, retrieved.ClientId);
    }

    [Fact]
    public async Task CanLinkEventToCase()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var source = new Source { Id = Guid.NewGuid(), UserId = userId, Type = "email" };
        var evt = new Event
        {
            Id = Guid.NewGuid(),
            SourceId = source.Id,
            ExternalId = "ext-1",
            Checksum = "abc123",
            OccurredAt = DateTime.UtcNow,
            IngestedAt = DateTime.UtcNow,
            RawPayload = "test payload"
        };
        var caseEntity = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test",
            CreatedAt = DateTime.UtcNow
        };

        db.Sources.Add(source);
        db.Events.Add(evt);
        db.Cases.Add(caseEntity);
        db.CaseEvents.Add(new CaseEvent { CaseId = caseEntity.Id, EventId = evt.Id });
        await db.SaveChangesAsync();

        var link = await db.CaseEvents.FindAsync(caseEntity.Id, evt.Id);
        Assert.NotNull(link);
    }

    [Fact]
    public async Task CanStoreAndRevokeRefreshToken()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();

        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = "test-refresh-token",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();

        var stored = await db.RefreshTokens.FindAsync(token.Id);
        Assert.NotNull(stored);
        Assert.True(stored.IsActive);

        // Révoquer
        stored.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        Assert.False(stored.IsActive);
        Assert.True(stored.IsRevoked);
    }

    [Fact]
    public async Task CanCreateNotification()
    {
        var db = TestDbContextFactory.Create();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = "INFO",
            Title = "Nouveau dossier",
            Message = "Un dossier a été créé",
            CreatedAt = DateTime.UtcNow
        };

        db.Notifications.Add(notification);
        await db.SaveChangesAsync();

        var retrieved = await db.Notifications.FindAsync(notification.Id);
        Assert.NotNull(retrieved);
        Assert.False(retrieved.IsRead);
    }
}
