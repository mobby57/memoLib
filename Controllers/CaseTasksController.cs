using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/tasks")]
public class CaseTasksController : ControllerBase
{
    private readonly CaseTasksService _tasksService;

    public CaseTasksController(CaseTasksService tasksService)
    {
        _tasksService = tasksService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks(Guid caseId, [FromQuery] bool? completed)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var tasks = await _tasksService.GetTasksAsync(caseId, userId, completed);
            return Ok(tasks);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask(Guid caseId, [FromBody] CreateCaseTaskRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Le titre de la tâche est obligatoire" });
        }

        try
        {
            var task = await _tasksService.CreateTaskAsync(
                caseId,
                userId,
                request.Title.Trim(),
                request.Description,
                request.AssignedToUserId,
                request.DueDate,
                request.Priority);

            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Dossier introuvable" });
        }
    }

    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> CompleteTask(Guid caseId, Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var task = await _tasksService.CompleteTaskAsync(caseId, id, userId);
        if (task == null)
        {
            return NotFound(new { message = "Tâche introuvable" });
        }

        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(Guid caseId, Guid id)
    {
        if (!this.TryGetCurrentUserId(out var userId))
        {
            return Unauthorized();
        }

        var deleted = await _tasksService.DeleteTaskAsync(caseId, id, userId);
        if (!deleted)
        {
            return NotFound(new { message = "Tâche introuvable" });
        }

        return NoContent();
    }
}

public sealed record CreateCaseTaskRequest(
    string Title,
    string? Description,
    Guid? AssignedToUserId,
    DateTime? DueDate,
    int Priority = 3);
