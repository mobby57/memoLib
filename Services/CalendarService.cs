using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class CalendarService
{
    private readonly MemoLibDbContext _context;

    public CalendarService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<CalendarEvent> CreateEventAsync(Guid userId, string title, DateTime startTime, DateTime endTime, string eventType, Guid? caseId = null)
    {
        var calendarEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CaseId = caseId,
            Title = title,
            StartTime = startTime,
            EndTime = endTime,
            EventType = eventType,
            Status = "scheduled"
        };

        _context.Set<CalendarEvent>().Add(calendarEvent);
        await _context.SaveChangesAsync();
        return calendarEvent;
    }

    public async Task<CalendarEvent> CreateDeadlineAsync(Guid userId, Guid caseId, DateTime deadline, string description)
    {
        return await CreateEventAsync(userId, $"Échéance: {description}", deadline.AddHours(-1), deadline, "deadline", caseId);
    }

    public async Task<List<CalendarEvent>> GetUpcomingEventsAsync(Guid userId, int days = 7)
    {
        var startDate = DateTime.UtcNow;
        var endDate = startDate.AddDays(days);

        return await _context.Set<CalendarEvent>()
            .Where(e => e.UserId == userId && e.StartTime >= startDate && e.StartTime <= endDate && e.Status == "scheduled")
            .OrderBy(e => e.StartTime)
            .ToListAsync();
    }

    public async Task<List<CalendarEvent>> GetEventsByDateAsync(Guid userId, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);

        return await _context.Set<CalendarEvent>()
            .Where(e => e.UserId == userId && e.StartTime >= startOfDay && e.StartTime < endOfDay)
            .OrderBy(e => e.StartTime)
            .ToListAsync();
    }
}