namespace MemoLib.Api.Models;

public class CalendarEvent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public string EventType { get; set; } = "meeting"; // meeting, deadline, hearing, consultation
    public bool IsAllDay { get; set; }
    public int ReminderMinutes { get; set; } = 60;
    public string Status { get; set; } = "scheduled"; // scheduled, completed, cancelled
    
    // Navigation
    public User? User { get; set; }
    public Case? Case { get; set; }
}