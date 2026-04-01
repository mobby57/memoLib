using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/forms")]
public class CustomFormsController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public CustomFormsController(MemoLibDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetForms()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var forms = await _context.CustomForms
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        return Ok(forms);
    }

    [HttpPost]
    public async Task<IActionResult> CreateForm([FromBody] CustomForm form)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        form.UserId = userId;
        form.CreatedAt = DateTime.UtcNow;
        
        _context.CustomForms.Add(form);
        await _context.SaveChangesAsync();
        return Ok(form);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetForm(Guid id)
    {
        var form = await _context.CustomForms.FirstOrDefaultAsync(f => f.Id == id && f.IsActive);
        if (form == null) return NotFound();
        return Ok(form);
    }

    [HttpPost("{id}/submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitForm(Guid id, [FromBody] FormSubmission submission)
    {
        var form = await _context.CustomForms.FirstOrDefaultAsync(f => f.Id == id && f.IsActive);
        if (form == null) return NotFound();

        submission.FormId = id;
        submission.SubmittedAt = DateTime.UtcNow;
        
        _context.FormSubmissions.Add(submission);
        await _context.SaveChangesAsync();
        return Ok(submission);
    }

    [HttpGet("{id}/submissions")]
    public async Task<IActionResult> GetSubmissions(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var form = await _context.CustomForms.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (form == null) return NotFound();

        var submissions = await _context.FormSubmissions
            .Where(s => s.FormId == id)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
        return Ok(submissions);
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var form = await _context.CustomForms.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (form == null) return NotFound();

        form.IsActive = !form.IsActive;
        await _context.SaveChangesAsync();
        return Ok(form);
    }
}
