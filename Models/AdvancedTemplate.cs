namespace MemoLib.Api.Models;

public class AdvancedTemplate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TemplateType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<TemplateVariable> Variables { get; set; } = new();
    public List<TemplateCondition> Conditions { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class TemplateVariable
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "text"; // text, number, date, boolean, list
    public string DefaultValue { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string? ValidationRule { get; set; }
}

public class TemplateCondition
{
    public string Variable { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals"; // equals, notEquals, contains, greaterThan, lessThan
    public string Value { get; set; } = string.Empty;
    public string ContentIfTrue { get; set; } = string.Empty;
    public string? ContentIfFalse { get; set; }
}

public enum TemplateType
{
    EMAIL,
    DOCUMENT,
    CONTRACT,
    LETTER,
    REPORT
}
