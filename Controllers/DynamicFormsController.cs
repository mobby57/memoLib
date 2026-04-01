using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Extensions;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/forms")]
public class DynamicFormsController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly DynamicFormService _formService;

    public DynamicFormsController(MemoLibDbContext context, DynamicFormService formService)
    {
        _context = context;
        _formService = formService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetForms()
    {
        var userId = this.GetUserId();
        var forms = await _context.DynamicForms
            .Where(f => f.UserId == userId && f.IsActive)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return Ok(forms);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetForm(Guid id)
    {
        var userId = this.GetUserId();
        var form = await _context.DynamicForms
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (form == null)
            return NotFound();

        return Ok(form);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateForm([FromBody] CreateFormRequest request)
    {
        var userId = this.GetUserId();
        var form = await _formService.CreateForm(userId, request.Name, request.Description, request.Fields, request.IsPublic);

        return CreatedAtAction(nameof(GetForm), new { id = form.Id }, form);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateForm(Guid id, [FromBody] CreateFormRequest request)
    {
        var userId = this.GetUserId();
        var form = await _context.DynamicForms
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (form == null)
            return NotFound();

        form.Name = request.Name;
        form.Description = request.Description;
        form.Fields = request.Fields;
        form.IsPublic = request.IsPublic;
        form.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(form);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteForm(Guid id)
    {
        var userId = this.GetUserId();
        var form = await _context.DynamicForms
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (form == null)
            return NotFound();

        form.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("public/{url}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicForm(string url)
    {
        var form = await _context.DynamicForms
            .FirstOrDefaultAsync(f => f.PublicUrl == $"/public/forms/{url}" && f.IsPublic && f.IsActive);

        if (form == null)
            return NotFound();

        return Ok(form);
    }

    [HttpPost("{id}/submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitForm(Guid id, [FromBody] SubmitFormRequest request)
    {
        var form = await _context.DynamicForms.FindAsync(id);
        if (form == null || !form.IsActive)
            return NotFound();

        // Validate
        var (isValid, errors) = await _formService.ValidateSubmission(form, request.Data);
        if (!isValid)
            return BadRequest(new { errors });

        // Submit
        var userId = User.Identity?.IsAuthenticated == true ? this.GetUserId() : (Guid?)null;
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        
        var submission = await _formService.SubmitForm(
            id, 
            request.Data, 
            userId, 
            request.Email, 
            request.Name, 
            ipAddress
        );

        return Ok(new { message = "Form submitted successfully", submissionId = submission.Id });
    }

    [HttpGet("{id}/submissions")]
    [Authorize]
    public async Task<IActionResult> GetSubmissions(Guid id)
    {
        var userId = this.GetUserId();
        var form = await _context.DynamicForms
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (form == null)
            return NotFound();

        var submissions = await _context.FormSubmissions
            .Where(s => s.FormId == id)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        return Ok(submissions);
    }
}

public class CreateFormRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<FormField> Fields { get; set; } = new();
    public bool IsPublic { get; set; }
}

public class SubmitFormRequest
{
    public Dictionary<string, object> Data { get; set; } = new();
    public string? Email { get; set; }
    public string? Name { get; set; }
}
