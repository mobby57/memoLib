using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Authorization;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/calendar")]
public class CalendarController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public CalendarController(MemoLibDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var userId = GetUserId();
        var query = _context.CalendarEvents.Where(e => e.UserId == userId);

        if (start.HasValue)
            query = query.Where(e => e.StartTime >= start.Value);
        
        if (end.HasValue)
            query = query.Where(e => e.StartTime <= end.Value);

        var events = await query.OrderBy(e => e.StartTime).ToListAsync();
        return Ok(events);
    }

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest request)
    {
        var userId = GetUserId();

        var calendarEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CaseId = request.CaseId,
            Title = request.Title,
            Description = request.Description ?? string.Empty,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Location = request.Location ?? string.Empty,
            MeetingLink = request.MeetingLink,
            CreatedAt = DateTime.UtcNow
        };

        _context.CalendarEvents.Add(calendarEvent);

        if (request.CaseId.HasValue)
        {
            _context.CaseActivities.Add(new CaseActivity
            {
                Id = Guid.NewGuid(),
                CaseId = request.CaseId.Value,
                UserId = userId,
                UserName = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                ActivityType = "EVENT_CREATED",
                Description = $"Événement créé: {request.Title}",
                OccurredAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return Ok(calendarEvent);
    }

    [HttpPut("events/{eventId}")]
    public async Task<IActionResult> UpdateEvent(Guid eventId, [FromBody] UpdateEventRequest request)
    {
        var userId = GetUserId();
        var calendarEvent = await _context.CalendarEvents.FindAsync(eventId);

        if (calendarEvent == null || calendarEvent.UserId != userId)
            return Forbid();

        calendarEvent.Title = request.Title;
        calendarEvent.Description = request.Description ?? string.Empty;
        calendarEvent.StartTime = request.StartTime;
        calendarEvent.EndTime = request.EndTime;
        calendarEvent.Location = request.Location ?? string.Empty;
        calendarEvent.MeetingLink = request.MeetingLink;

        await _context.SaveChangesAsync();

        return Ok(calendarEvent);
    }

    [HttpDelete("events/{eventId}")]
    public async Task<IActionResult> DeleteEvent(Guid eventId)
    {
        var userId = GetUserId();
        var calendarEvent = await _context.CalendarEvents.FindAsync(eventId);

        if (calendarEvent == null || calendarEvent.UserId != userId)
            return Forbid();

        _context.CalendarEvents.Remove(calendarEvent);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Événement supprimé" });
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingEvents([FromQuery] int days = 7)
    {
        var userId = GetUserId();
        var now = DateTime.UtcNow;
        var end = now.AddDays(days);

        var events = await _context.CalendarEvents
            .Where(e => e.UserId == userId && e.StartTime >= now && e.StartTime <= end)
            .OrderBy(e => e.StartTime)
            .ToListAsync();

        return Ok(events);
    }
}

public record CreateEventRequest(
    Guid? CaseId,
    string Title,
    string? Description,
    DateTime StartTime,
    DateTime EndTime,
    string? Location,
    string? MeetingLink);

public record UpdateEventRequest(
    string Title,
    string? Description,
    DateTime StartTime,
    DateTime EndTime,
    string? Location,
    string? MeetingLink);
