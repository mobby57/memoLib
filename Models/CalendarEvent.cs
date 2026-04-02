using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class CalendarEvent : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid? CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? MeetingLink { get; set; }
    public string EventType { get; set; } = "meeting";
    public bool IsAllDay { get; set; }
    public int ReminderMinutes { get; set; } = 60;
    public string Status { get; set; } = "scheduled";

    // Navigation
    public User? User { get; set; }
    public Case? Case { get; set; }
}
