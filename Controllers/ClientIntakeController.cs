using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/intake")]
public class ClientIntakeController : ControllerBase
{
    private readonly ClientIntakeService _intakeService;

    public ClientIntakeController(ClientIntakeService intakeService)
    {
        _intakeService = intakeService;
    }

    [HttpPost("forms")]
    [Authorize]
    public async Task<IActionResult> CreateForm([FromBody] ClientIntakeForm form)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var created = await _intakeService.CreateFormTemplateAsync(userId, form);
        return Ok(created);
    }

    [HttpGet("forms")]
    [Authorize]
    public async Task<IActionResult> GetMyForms()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var forms = await _intakeService.GetUserFormsAsync(userId);
        return Ok(forms);
    }

    [HttpGet("forms/{formId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFormById(Guid formId)
    {
        var form = await _intakeService.GetFormByIdAsync(formId);
        if (form == null) return NotFound();
        return Ok(form);
    }

    [HttpPost("submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitForm([FromBody] ClientIntakeSubmission submission)
    {
        var result = await _intakeService.SubmitFormAsync(submission);
        return Ok(new { message = "Formulaire soumis avec succès", submissionId = result.Id });
    }

    [HttpGet("submissions/pending")]
    [Authorize]
    public async Task<IActionResult> GetPendingSubmissions()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var submissions = await _intakeService.GetPendingSubmissionsAsync(userId);
        return Ok(submissions);
    }
}
