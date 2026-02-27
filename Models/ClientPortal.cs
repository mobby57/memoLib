namespace MemoLib.Api.Models;

public class ClientPortalView
{
    public Guid CaseId { get; set; }
    public string Title { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int Priority { get; set; }
    public DateTime? DueDate { get; set; }
    public List<TimelineEvent> Timeline { get; set; } = new();
    public List<NextAction> NextActions { get; set; } = new();
}

public class TimelineEvent
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public bool VisibleToClient { get; set; }
}

public class NextAction
{
    public string Action { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime? DueDate { get; set; }
    public bool IsClientAction { get; set; }
}
