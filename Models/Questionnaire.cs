namespace MemoLib.Api.Models;

public class Questionnaire
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string EventType { get; set; } = null!;
    public string? Tags { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public List<Question> Questions { get; set; } = new();
}

public class Question
{
    public Guid Id { get; set; }
    public Guid QuestionnaireId { get; set; }
    public string Text { get; set; } = null!;
    public string Type { get; set; } = "TEXT"; // TEXT, CHOICE, BOOLEAN, NUMBER, DATE
    public string? Options { get; set; } // JSON pour les choix multiples
    public bool IsRequired { get; set; } = false;
    public int Order { get; set; }
}

public class QuestionnaireResponse
{
    public Guid Id { get; set; }
    public Guid QuestionnaireId { get; set; }
    public Guid CaseId { get; set; }
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CompletedAt { get; set; }
    public List<Answer> Answers { get; set; } = new();
}

public class Answer
{
    public Guid Id { get; set; }
    public Guid ResponseId { get; set; }
    public Guid QuestionId { get; set; }
    public string Value { get; set; } = null!;
}