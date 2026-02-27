namespace MemoLib.Api.Models;

public class TaskDependency
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid DependsOnTaskId { get; set; }
}

public class TaskChecklistItem
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string Title { get; set; } = null!;
    public bool IsCompleted { get; set; }
    public int Order { get; set; }
}
