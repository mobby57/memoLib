using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Models;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/satisfaction")]
public class SatisfactionController : ControllerBase
{
    private readonly SatisfactionSurveyService _service;

    public SatisfactionController(SatisfactionSurveyService service)
    {
        _service = service;
    }

    [AllowAnonymous]
    [HttpGet("survey/{token}")]
    public async Task<IActionResult> GetSurvey(string token)
    {
        var survey = await _service.GetSurveyByTokenAsync(token);
        if (survey == null) return NotFound(new { message = "Enquête introuvable ou expirée" });
        return Ok(survey);
    }

    [AllowAnonymous]
    [HttpPost("survey/{token}")]
    public async Task<IActionResult> SubmitSurvey(string token, [FromBody] SatisfactionSurvey response)
    {
        var success = await _service.SubmitSurveyAsync(token, response);
        if (!success) return BadRequest(new { message = "Impossible de soumettre l'enquête" });
        return Ok(new { message = "Merci pour votre retour !" });
    }

    [Authorize]
    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformance()
    {
        var performance = await _service.GetLawyerPerformanceAsync();
        return Ok(performance);
    }
}
