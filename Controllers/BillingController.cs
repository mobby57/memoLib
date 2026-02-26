using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly BillingService _billingService;

    public BillingController(BillingService billingService)
    {
        _billingService = billingService;
    }

    [HttpPost("timer/start")]
    public async Task<IActionResult> StartTimer([FromBody] StartTimerRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? throw new UnauthorizedAccessException());
        var entry = await _billingService.StartTimerAsync(request.CaseId, userId, request.Description, request.HourlyRate);
        return Ok(entry);
    }

    [HttpPost("timer/stop/{entryId}")]
    public async Task<IActionResult> StopTimer(Guid entryId)
    {
        var entry = await _billingService.StopTimerAsync(entryId);
        return Ok(new { entry.Id, entry.Duration, entry.Amount });
    }

    [HttpPost("invoice/generate")]
    public async Task<IActionResult> GenerateInvoice([FromBody] GenerateInvoiceRequest request)
    {
        var invoice = await _billingService.GenerateInvoiceAsync(request.CaseId, request.ClientId);
        return Ok(invoice);
    }

    [HttpGet("case/{caseId}/time-entries")]
    public async Task<IActionResult> GetCaseTimeEntries(Guid caseId)
    {
        var entries = await _billingService.GetCaseTimeEntriesAsync(caseId);
        return Ok(entries);
    }
}

public record StartTimerRequest(Guid CaseId, string Description, decimal HourlyRate);
public record GenerateInvoiceRequest(Guid CaseId, Guid ClientId);