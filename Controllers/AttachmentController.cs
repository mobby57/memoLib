using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentController : ControllerBase
{
    private readonly MemoLibDbContext _db;
    private readonly string _uploadPath;

    public AttachmentController(MemoLibDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _uploadPath = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(_uploadPath);
    }

    [HttpPost("upload/{eventId}")]
    public async Task<IActionResult> Upload(Guid eventId, IFormFile file)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();
        var evt = await _db.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        if (evt == null) return NotFound();

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(_uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var attachment = new Models.Attachment
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            FilePath = filePath,
            UploadedAt = DateTime.UtcNow
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync();
        return Ok(attachment);
    }

    [HttpGet("{attachmentId}")]
    public async Task<IActionResult> Download(Guid attachmentId)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId);
        if (attachment == null || !System.IO.File.Exists(attachment.FilePath))
            return NotFound();

        var bytes = await System.IO.File.ReadAllBytesAsync(attachment.FilePath);
        return File(bytes, attachment.ContentType, attachment.FileName);
    }

    [HttpGet("event/{eventId}")]
    public IActionResult ListByEvent(Guid eventId)
    {
        var attachments = _db.Attachments.Where(a => a.EventId == eventId).ToList();
        return Ok(attachments);
    }
}
