using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Extensions;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/templates/advanced")]
[Authorize]
public class AdvancedTemplatesController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly AdvancedTemplateService _templateService;

    public AdvancedTemplatesController(MemoLibDbContext context, AdvancedTemplateService templateService)
    {
        _context = context;
        _templateService = templateService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTemplates()
    {
        var userId = this.GetUserId();
        var templates = await _context.AdvancedTemplates
            .Where(t => t.UserId == userId && t.IsActive)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTemplate(Guid id)
    {
        var userId = this.GetUserId();
        var template = await _context.AdvancedTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (template == null)
            return NotFound();

        return Ok(template);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] AdvancedTemplate template)
    {
        template.Id = Guid.NewGuid();
        template.UserId = this.GetUserId();
        template.CreatedAt = DateTime.UtcNow;

        _context.AdvancedTemplates.Add(template);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, template);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] AdvancedTemplate updated)
    {
        var userId = this.GetUserId();
        var template = await _context.AdvancedTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (template == null)
            return NotFound();

        template.Name = updated.Name;
        template.Description = updated.Description;
        template.Content = updated.Content;
        template.Variables = updated.Variables;
        template.Conditions = updated.Conditions;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(template);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        var userId = this.GetUserId();
        var template = await _context.AdvancedTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (template == null)
            return NotFound();

        template.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/render")]
    public async Task<IActionResult> RenderTemplate(Guid id, [FromBody] Dictionary<string, object> variables)
    {
        var userId = this.GetUserId();
        var template = await _context.AdvancedTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (template == null)
            return NotFound();

        var rendered = _templateService.RenderTemplate(template, variables);
        return Ok(new { content = rendered });
    }

    [HttpPost("{id}/render-for-case/{caseId}")]
    public async Task<IActionResult> RenderForCase(Guid id, Guid caseId)
    {
        var userId = this.GetUserId();
        var template = await _context.AdvancedTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (template == null)
            return NotFound();

        var caseData = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId && c.UserId == userId);

        if (caseData == null)
            return NotFound("Case not found");

        var client = caseData.ClientId.HasValue ? await _context.Clients.FindAsync(caseData.ClientId.Value) : null;
        var variables = _templateService.ExtractVariablesFromCase(caseData, client);
        var rendered = _templateService.RenderTemplate(template, variables);

        return Ok(new { content = rendered, variables });
    }
}
