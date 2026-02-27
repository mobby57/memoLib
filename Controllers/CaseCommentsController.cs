using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Authorization;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cases/{caseId}/comments")]
public class CaseCommentsController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly RealtimeNotificationService _realtimeService;

    public CaseCommentsController(MemoLibDbContext context, RealtimeNotificationService realtimeService)
    {
        _context = context;
        _realtimeService = realtimeService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetUserName() => User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown";

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid caseId)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var comments = await _context.CaseComments
            .Where(c => c.CaseId == caseId && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .Join(_context.Users, c => c.UserId, u => u.Id, (c, u) => new
            {
                c.Id,
                c.CaseId,
                c.UserId,
                UserName = u.Name ?? u.Email,
                c.Content,
                c.ParentCommentId,
                c.Mentions,
                c.CreatedAt,
                c.EditedAt
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(Guid caseId, [FromBody] AddCommentRequest request)
    {
        var userId = GetUserId();
        var case_ = await _context.Cases.FindAsync(caseId);
        
        if (case_ == null || !User.CanAccessResource(case_.UserId))
            return Forbid();

        var comment = new CaseComment
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            Content = request.Content,
            ParentCommentId = request.ParentCommentId,
            Mentions = request.Mentions,
            CreatedAt = DateTime.UtcNow
        };

        _context.CaseComments.Add(comment);

        _context.CaseActivities.Add(new CaseActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            UserName = GetUserName(),
            ActivityType = "COMMENT_ADDED",
            Description = "Commentaire ajouté",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        await _realtimeService.NotifyNewCommentAsync(caseId, comment, GetUserName());

        return Ok(comment);
    }

    [HttpPut("{commentId}")]
    public async Task<IActionResult> UpdateComment(Guid caseId, Guid commentId, [FromBody] UpdateCommentRequest request)
    {
        var userId = GetUserId();
        var comment = await _context.CaseComments.FindAsync(commentId);

        if (comment == null || comment.CaseId != caseId || comment.UserId != userId)
            return Forbid();

        comment.Content = request.Content;
        comment.EditedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(comment);
    }

    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid caseId, Guid commentId)
    {
        var userId = GetUserId();
        var comment = await _context.CaseComments.FindAsync(commentId);

        if (comment == null || comment.CaseId != caseId || comment.UserId != userId)
            return Forbid();

        comment.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Commentaire supprimé" });
    }
}

public record AddCommentRequest(string Content, Guid? ParentCommentId, string? Mentions);
public record UpdateCommentRequest(string Content);
