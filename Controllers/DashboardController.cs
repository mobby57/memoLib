using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AnalyticsService _analyticsService;

    public DashboardController(AnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        var metrics = await _analyticsService.GetMetricsAsync(userId);
        return Ok(metrics);
    }

    [HttpGet("realtime-stats")]
    public async Task<IActionResult> GetRealtimeStats()
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        var metrics = await _analyticsService.GetMetricsAsync(userId);
        
        return Ok(new
        {
            emailsToday = metrics.EmailsToday,
            openAnomalies = metrics.OpenAnomalies,
            avgResponseTime = $"{metrics.AverageResponseTimeHours:F1}h",
            status = metrics.OpenAnomalies > 0 ? "attention" : "ok"
        });
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        var metrics = await _analyticsService.GetMetricsAsync(userId);
        
        return Ok(new
        {
            stats = new
            {
                totalCases = metrics.TotalCases,
                totalClients = metrics.TotalClients,
                emailsToday = metrics.EmailsToday,
                openAnomalies = metrics.OpenAnomalies
            },
            metrics
        });
    }
}