using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;

namespace MemoLib.Tests;

public class BillingServiceTests : IDisposable
{
    private readonly MemoLibDbContext _context;
    private readonly BillingService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _caseId = Guid.NewGuid();
    private readonly Guid _clientId = Guid.NewGuid();

    public BillingServiceTests()
    {
        var options = new DbContextOptionsBuilder<MemoLibDbContext>()
            .UseInMemoryDatabase(databaseName: $"BillingTest_{Guid.NewGuid()}")
            .Options;

        _context = new MemoLibDbContext(options);
        _sut = new BillingService(_context);
    }

    [Fact]
    public async Task StartTimerAsync_CreatesTimeEntry()
    {
        var entry = await _sut.StartTimerAsync(_caseId, _userId, "Rédaction conclusions", 150m);

        Assert.NotEqual(Guid.Empty, entry.Id);
        Assert.Equal(_caseId, entry.CaseId);
        Assert.Equal(_userId, entry.UserId);
        Assert.Equal("Rédaction conclusions", entry.Description);
        Assert.Equal(150m, entry.HourlyRate);
        Assert.Null(entry.EndTime);
        Assert.True(entry.StartTime <= DateTime.UtcNow);
    }

    [Fact]
    public async Task StartTimerAsync_PersistsToDatabase()
    {
        var entry = await _sut.StartTimerAsync(_caseId, _userId, "Recherche", 100m);

        var fromDb = await _context.Set<TimeEntry>().FindAsync(entry.Id);
        Assert.NotNull(fromDb);
        Assert.Equal("Recherche", fromDb.Description);
    }

    [Fact]
    public async Task StopTimerAsync_SetsEndTime()
    {
        var entry = await _sut.StartTimerAsync(_caseId, _userId, "Appel client", 120m);

        var stopped = await _sut.StopTimerAsync(entry.Id);

        Assert.NotNull(stopped.EndTime);
        Assert.True(stopped.EndTime >= stopped.StartTime);
    }

    [Fact]
    public async Task StopTimerAsync_NonExistentId_ThrowsException()
    {
        await Assert.ThrowsAsync<Exception>(() => _sut.StopTimerAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task GenerateInvoiceAsync_CreatesInvoice()
    {
        // Seed a completed billable time entry
        var entry = new TimeEntry
        {
            Id = Guid.NewGuid(),
            CaseId = _caseId,
            UserId = _userId,
            StartTime = DateTime.UtcNow.AddHours(-2),
            EndTime = DateTime.UtcNow,
            Description = "Audience",
            HourlyRate = 200m,
            IsBillable = true
        };
        _context.Set<TimeEntry>().Add(entry);
        await _context.SaveChangesAsync();

        var invoice = await _sut.GenerateInvoiceAsync(_caseId, _clientId);

        Assert.NotEqual(Guid.Empty, invoice.Id);
        Assert.Equal(_caseId, invoice.CaseId);
        Assert.Equal(_clientId, invoice.ClientId);
        Assert.StartsWith("INV-", invoice.InvoiceNumber);
        Assert.Equal("draft", invoice.Status);
        Assert.True(invoice.DueDate > invoice.IssueDate);
    }

    [Fact]
    public async Task GenerateInvoiceAsync_CalculatesTVA20Percent()
    {
        var entry = new TimeEntry
        {
            Id = Guid.NewGuid(),
            CaseId = _caseId,
            UserId = _userId,
            StartTime = DateTime.UtcNow.AddHours(-1),
            EndTime = DateTime.UtcNow,
            Description = "Consultation",
            HourlyRate = 100m,
            IsBillable = true
        };
        _context.Set<TimeEntry>().Add(entry);
        await _context.SaveChangesAsync();

        var invoice = await _sut.GenerateInvoiceAsync(_caseId, _clientId);

        Assert.Equal(invoice.TotalAmount * 0.20m, invoice.TaxAmount);
    }

    [Fact]
    public async Task GenerateInvoiceAsync_NoBillableEntries_ZeroAmount()
    {
        var invoice = await _sut.GenerateInvoiceAsync(_caseId, _clientId);

        Assert.Equal(0m, invoice.TotalAmount);
        Assert.Equal(0m, invoice.TaxAmount);
    }

    [Fact]
    public async Task GetCaseTimeEntriesAsync_ReturnsOrderedByStartTime()
    {
        var older = new TimeEntry
        {
            Id = Guid.NewGuid(), CaseId = _caseId, UserId = _userId,
            StartTime = DateTime.UtcNow.AddDays(-2), Description = "Old", HourlyRate = 100m
        };
        var newer = new TimeEntry
        {
            Id = Guid.NewGuid(), CaseId = _caseId, UserId = _userId,
            StartTime = DateTime.UtcNow, Description = "New", HourlyRate = 100m
        };
        _context.Set<TimeEntry>().AddRange(older, newer);
        await _context.SaveChangesAsync();

        var entries = await _sut.GetCaseTimeEntriesAsync(_caseId);

        Assert.Equal(2, entries.Count);
        Assert.Equal("New", entries[0].Description);
        Assert.Equal("Old", entries[1].Description);
    }

    [Fact]
    public async Task GetCaseTimeEntriesAsync_OnlyReturnsCaseEntries()
    {
        var otherCaseId = Guid.NewGuid();
        _context.Set<TimeEntry>().AddRange(
            new TimeEntry { Id = Guid.NewGuid(), CaseId = _caseId, UserId = _userId, StartTime = DateTime.UtcNow, Description = "Mine", HourlyRate = 100m },
            new TimeEntry { Id = Guid.NewGuid(), CaseId = otherCaseId, UserId = _userId, StartTime = DateTime.UtcNow, Description = "Other", HourlyRate = 100m }
        );
        await _context.SaveChangesAsync();

        var entries = await _sut.GetCaseTimeEntriesAsync(_caseId);

        Assert.Single(entries);
        Assert.Equal("Mine", entries[0].Description);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
