using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MemoLib.Api.Data;

public class MemoLibDbContextFactory : IDesignTimeDbContextFactory<MemoLibDbContext>
{
    public MemoLibDbContext CreateDbContext(string[] args)
    {
        try
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("Default")
                ?? "Data Source=memolib.db";

            var optionsBuilder = new DbContextOptionsBuilder<MemoLibDbContext>();
            optionsBuilder.UseSqlite(connectionString);

            return new MemoLibDbContext(optionsBuilder.Options);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to create MemoLibDbContext during design-time.", ex);
        }
    }
}
