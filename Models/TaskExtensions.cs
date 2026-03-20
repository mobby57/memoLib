using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class TaskDependency : BaseEntity
{
    public Guid TaskId { get; set; }
    public Guid DependsOnTaskId { get; set; }

    // Navigation
    public CaseTask? Task { get; set; }
    public CaseTask? DependsOnTask { get; set; }
}

public class TaskChecklistItem : BaseEntity
{
    public Guid TaskId { get; set; }
    public string Title { get; set; } = null!;
    public bool IsCompleted { get; set; }
    public int Order { get; set; }

    // Navigation
    public CaseTask? Task { get; set; }
}
