using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Extensions;
using MemoLib.Api.Models;

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

    private async Task<bool> UserOwnsEventAsync(Guid userId, Guid eventId)
    {
        var userSourceIds = await _db.Sources
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        return await _db.Events.AnyAsync(e => e.Id == eventId && userSourceIds.Contains(e.SourceId));
    }

    [HttpPost("upload/{eventId}")]
    [RequestSizeLimit(Attachment.MaxFileSize)]
    public async Task<IActionResult> Upload(Guid eventId, IFormFile file)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();

        if (file.Length > Attachment.MaxFileSize)
            return BadRequest(new { message = $"Fichier trop volumineux. Max: {Attachment.MaxFileSize / 1024 / 1024} Mo" });

        var ext = Path.GetExtension(file.FileName);
        if (Attachment.BlockedExtensions.Contains(ext))
            return BadRequest(new { message = $"Extension {ext} non autorisee" });

        if (!await UserOwnsEventAsync(userId, eventId))
            return NotFound();

        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(_uploadPath, fileName);

        string checksum;
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
            stream.Position = 0;
            checksum = Convert.ToHexString(await SHA256.HashDataAsync(stream));
        }

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            FilePath = filePath,
            Checksum = checksum,
            UploadedAt = DateTime.UtcNow
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync();
        return Ok(attachment);
    }

    [HttpGet("{attachmentId}")]
    public async Task<IActionResult> Download(Guid attachmentId)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();

        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId);
        if (attachment == null || !System.IO.File.Exists(attachment.FilePath))
            return NotFound();

        if (!await UserOwnsEventAsync(userId, attachment.EventId))
            return NotFound();

        // Verification integrite
        if (!string.IsNullOrEmpty(attachment.Checksum))
        {
            var fileHash = Convert.ToHexString(SHA256.HashData(await System.IO.File.ReadAllBytesAsync(attachment.FilePath)));
            if (fileHash != attachment.Checksum)
                return StatusCode(500, new { message = "Integrite du fichier compromise" });
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(attachment.FilePath);
        return File(bytes, attachment.ContentType, attachment.FileName);
    }

    [HttpGet("event/{eventId}")]
    public async Task<IActionResult> ListByEvent(Guid eventId)
    {
        if (!this.TryGetCurrentUserId(out var userId)) return Unauthorized();

        if (!await UserOwnsEventAsync(userId, eventId))
            return NotFound();

        var attachments = await _db.Attachments.Where(a => a.EventId == eventId).ToListAsync();
        return Ok(attachments);
    }
}
