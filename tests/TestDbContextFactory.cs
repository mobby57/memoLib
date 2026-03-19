using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Tests;

public static class TestDbContextFactory
{
    public static MemoLibDbContext Create()
    {
        var options = new DbContextOptionsBuilder<MemoLibDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new MemoLibDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
