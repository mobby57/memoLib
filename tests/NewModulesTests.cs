using MemoLib.Api.Models;
using MemoLib.Api.Services;

namespace MemoLib.Tests;

public class ExcelExportServiceTests
{
    [Fact]
    public async Task ExportCasesAsync_ReturnsValidXlsx()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Cases.Add(new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Excel",
            Status = "OPEN",
            Priority = 2,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var sut = new ExcelExportService(db);
        var result = await sut.ExportCasesAsync(userId);

        Assert.NotEmpty(result);
        // XLSX magic bytes: PK (ZIP format)
        Assert.Equal(0x50, result[0]);
        Assert.Equal(0x4B, result[1]);
    }

    [Fact]
    public async Task ExportClientsAsync_ReturnsValidXlsx()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Clients.Add(new Client
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Jean Dupont",
            Email = "jean@test.com",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var sut = new ExcelExportService(db);
        var result = await sut.ExportClientsAsync(userId);

        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task ExportCasesAsync_WithStatusFilter_FiltersCorrectly()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Cases.AddRange(
            new Case { Id = Guid.NewGuid(), UserId = userId, Title = "Open", Status = "OPEN", CreatedAt = DateTime.UtcNow },
            new Case { Id = Guid.NewGuid(), UserId = userId, Title = "Closed", Status = "CLOSED", CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var sut = new ExcelExportService(db);
        var result = await sut.ExportCasesAsync(userId, status: "OPEN");

        Assert.NotEmpty(result);
    }
}

public class CustomReportBuilderServiceTests
{
    [Fact]
    public async Task BuildReportAsync_Cases_ReturnsRows()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Cases.Add(new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Rapport Test",
            Status = "OPEN",
            Priority = 3,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var sut = new CustomReportBuilderService(db);
        var result = await sut.BuildReportAsync(userId, new CustomReportRequest
        {
            Name = "Test",
            DataSource = "CASES",
            Columns = new List<string> { "Title", "Status", "Priority" }
        });

        Assert.Equal(1, result.TotalRows);
        Assert.Single(result.Rows);
        Assert.Equal("Rapport Test", result.Rows[0]["Title"]);
    }

    [Fact]
    public async Task BuildReportAsync_WithAggregations_ComputesCorrectly()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Cases.AddRange(
            new Case { Id = Guid.NewGuid(), UserId = userId, Title = "A", Priority = 2, CreatedAt = DateTime.UtcNow },
            new Case { Id = Guid.NewGuid(), UserId = userId, Title = "B", Priority = 4, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var sut = new CustomReportBuilderService(db);
        var result = await sut.BuildReportAsync(userId, new CustomReportRequest
        {
            Name = "Agg Test",
            DataSource = "CASES",
            Columns = new List<string> { "Title", "Priority" },
            Aggregations = new List<AggregationRequest>
            {
                new() { Column = "Priority", Function = "SUM" },
                new() { Column = "Priority", Function = "AVG" },
                new() { Column = "Priority", Function = "COUNT" }
            }
        });

        Assert.NotNull(result.Aggregations);
        Assert.Equal(6.0, Convert.ToDouble(result.Aggregations["SUM_Priority"]));
        Assert.Equal(3.0, Convert.ToDouble(result.Aggregations["AVG_Priority"]));
        Assert.Equal(2, Convert.ToInt32(result.Aggregations["COUNT_Priority"]));
    }

    [Fact]
    public async Task BuildReportAsync_UnknownDataSource_Throws()
    {
        var db = TestDbContextFactory.Create();
        var sut = new CustomReportBuilderService(db);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            sut.BuildReportAsync(Guid.NewGuid(), new CustomReportRequest { DataSource = "UNKNOWN" }));
    }

    [Fact]
    public async Task BuildReportAsync_SavesReportToDb()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var sut = new CustomReportBuilderService(db);

        var result = await sut.BuildReportAsync(userId, new CustomReportRequest
        {
            Name = "Saved Report",
            DataSource = "CASES"
        });

        Assert.NotEqual(Guid.Empty, result.ReportId);
        var saved = await db.Reports.FindAsync(result.ReportId);
        Assert.NotNull(saved);
        Assert.Equal("Saved Report", saved.Name);
    }
}
