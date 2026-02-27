using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public ReportsController(MemoLibDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetReports()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var reports = await _context.Reports
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.GeneratedAt)
            .ToListAsync();
        return Ok(reports);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateReport([FromBody] Report report)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        report.UserId = userId;
        report.GeneratedAt = DateTime.UtcNow;

        var data = report.ReportType switch
        {
            "TIME_BY_CASE" => await GenerateTimeByCaseReport(userId, report.StartDate, report.EndDate),
            "REVENUE_BY_CLIENT" => await GenerateRevenueByClientReport(userId, report.StartDate, report.EndDate),
            "CASE_STATUS" => await GenerateCaseStatusReport(userId),
            _ => null
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();
        return Ok(new { report, data });
    }

    private async Task<object> GenerateTimeByCaseReport(Guid userId, DateTime? start, DateTime? end)
    {
        var query = _context.Set<TimeEntry>().Where(t => t.UserId == userId);
        if (start.HasValue) query = query.Where(t => t.StartTime >= start.Value);
        if (end.HasValue) query = query.Where(t => t.StartTime <= end.Value);

        var data = await query
            .GroupBy(t => t.CaseId)
            .Select(g => new
            {
                CaseId = g.Key,
                TotalHours = g.Sum(t => t.Duration),
                TotalAmount = g.Sum(t => t.Amount)
            })
            .ToListAsync();

        return data;
    }

    private async Task<object> GenerateRevenueByClientReport(Guid userId, DateTime? start, DateTime? end)
    {
        var query = _context.Set<Invoice>().Where(i => _context.Cases.Any(c => c.Id == i.CaseId && c.UserId == userId));
        if (start.HasValue) query = query.Where(i => i.IssueDate >= start.Value);
        if (end.HasValue) query = query.Where(i => i.IssueDate <= end.Value);

        var data = await query
            .GroupBy(i => i.ClientId)
            .Select(g => new
            {
                ClientId = g.Key,
                TotalInvoiced = g.Sum(i => i.TotalAmount),
                TotalPaid = g.Where(i => i.Status == "paid").Sum(i => i.TotalAmount)
            })
            .ToListAsync();

        return data;
    }

    private async Task<object> GenerateCaseStatusReport(Guid userId)
    {
        var data = await _context.Cases
            .Where(c => c.UserId == userId)
            .GroupBy(c => c.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return data;
    }
}
