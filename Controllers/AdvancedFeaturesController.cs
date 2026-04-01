using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;
using MemoLib.Api.Authorization;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/advanced")]
public class AdvancedFeaturesController : ControllerBase
{
    private readonly AdvancedSearchService _searchService;
    private readonly ExportService _exportService;
    private readonly WorkflowAutomationService _workflowService;

    public AdvancedFeaturesController(
        AdvancedSearchService searchService,
        ExportService exportService,
        WorkflowAutomationService workflowService)
    {
        _searchService = searchService;
        _exportService = exportService;
        _workflowService = workflowService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [Authorize(Policy = Policies.ViewCases)]
    [HttpPost("search")]
    public async Task<IActionResult> AdvancedSearch([FromBody] SearchCriteria criteria)
    {
        var userId = GetUserId();
        var results = await _searchService.SearchAsync(userId, criteria);
        return Ok(results);
    }

    [Authorize(Policy = Policies.ExportCases)]
    [HttpGet("export/case/{caseId}")]
    public async Task<IActionResult> ExportCase(Guid caseId, [FromQuery] string format = "json")
    {
        var userId = GetUserId();
        
        try
        {
            var (data, contentType, fileName) = await _exportService.ExportCaseAsync(caseId, userId, format);
            return File(data, contentType, fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = Policies.EditCases)]
    [HttpPost("workflow/execute/{caseId}")]
    public async Task<IActionResult> ExecuteWorkflow(Guid caseId, [FromQuery] string trigger)
    {
        var userId = GetUserId();
        var success = await _workflowService.ExecuteWorkflowAsync(caseId, trigger, userId);
        return Ok(new { success, message = "Workflow exécuté" });
    }
}
