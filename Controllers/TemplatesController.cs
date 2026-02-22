using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TemplatesController : ControllerBase
{
    private readonly TemplateEngineService _templateService;

    public TemplatesController(TemplateEngineService templateService)
    {
        _templateService = templateService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateResponse([FromBody] GenerateTemplateRequest request)
    {
        var response = await _templateService.GenerateResponseAsync(
            request.ClientContext, 
            request.Subject, 
            request.CaseType ?? "general"
        );

        return Ok(new { generatedResponse = response });
    }

    [HttpGet]
    public async Task<IActionResult> GetTemplates()
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        var templates = await _templateService.GetUserTemplatesAsync(userId);
        return Ok(templates);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequestDto request)
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        var template = await _templateService.CreateTemplateAsync(
            userId, 
            request.Name, 
            request.Category, 
            request.Subject, 
            request.Body
        );

        return Ok(template);
    }
}

public class GenerateTemplateRequest
{
    public string ClientContext { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string? CaseType { get; set; }
}

public class CreateTemplateRequestDto
{
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string Body { get; set; } = null!;
}