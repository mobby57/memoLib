using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MemoLib.Api.Data;

public class MemoLibDbContextFactory : IDesignTimeDbContextFactory<MemoLibDbContext>
{
    public MemoLibDbContext CreateDbContext(string[] args)
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
        var usePostgres = configuration.GetValue<bool>("UsePostgreSQL");

        var optionsBuilder = new DbContextOptionsBuilder<MemoLibDbContext>();

        if (usePostgres)
        {
            optionsBuilder.UseNpgsql(connectionString, o => o.MigrationsAssembly("MemoLib.Api"));
        }
        else
        {
            optionsBuilder.UseSqlite(connectionString);
        }

        return new MemoLibDbContext(optionsBuilder.Options);
    }
}
