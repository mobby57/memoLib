using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Questionnaire : AuditableEntity
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string EventType { get; set; } = null!;
    public string? Tags { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public List<Question> Questions { get; set; } = new();
    public ICollection<QuestionnaireResponse> Responses { get; set; } = new List<QuestionnaireResponse>();
}

public class Question : BaseEntity
{
    public Guid QuestionnaireId { get; set; }
    public string Text { get; set; } = null!;
    public string Type { get; set; } = "TEXT";
    public string? Options { get; set; }
    public bool IsRequired { get; set; } = false;
    public int Order { get; set; }

    // Navigation
    public Questionnaire? Questionnaire { get; set; }
}

public class QuestionnaireResponse : BaseEntity
{
    public Guid QuestionnaireId { get; set; }
    public Guid CaseId { get; set; }
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CompletedAt { get; set; }

    // Navigation
    public Questionnaire? Questionnaire { get; set; }
    public Case? Case { get; set; }
    public User? User { get; set; }
    public List<Answer> Answers { get; set; } = new();
}

public class Answer : BaseEntity
{
    public Guid ResponseId { get; set; }
    public Guid QuestionId { get; set; }
    public string Value { get; set; } = null!;

    // Navigation
    public QuestionnaireResponse? Response { get; set; }
    public Question? Question { get; set; }
}
