using System.ComponentModel.DataAnnotations.Schema;
using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class DynamicForm : TenantEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<FormField> Fields { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; }
    public string? PublicUrl { get; set; }

    // Navigation
    public User? User { get; set; }
}

public class FormField
{
    public string Name { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public FieldType Type { get; set; }
    public bool IsRequired { get; set; }
    public int Order { get; set; }
    public string? Placeholder { get; set; }
    public string? DefaultValue { get; set; }
    public List<string>? Options { get; set; }
    public FieldValidation? Validation { get; set; }
    public FieldCondition? Condition { get; set; }
}

public class FieldValidation
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Pattern { get; set; }
    public int? Min { get; set; }
    public int? Max { get; set; }
    public string? CustomMessage { get; set; }
}

public class FieldCondition
{
    public string DependsOnField { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public string Value { get; set; } = string.Empty;
}

public class FormSubmission : BaseEntity
{
    public Guid FormId { get; set; }
    public Guid? CaseId { get; set; }
    public string SubmitterEmail { get; set; } = string.Empty;
    public string SubmitterName { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, string> Responses { get; set; } = new();
    public string? SignatureUrl { get; set; }

    [NotMapped]
    public Guid? UserId { get; set; }

    [NotMapped]
    public string? IpAddress { get; set; }

    [NotMapped]
    public Dictionary<string, object> Data
    {
        get => Responses.ToDictionary(kvp => kvp.Key, kvp => (object)kvp.Value);
        set => Responses = value.ToDictionary(kvp => kvp.Key, kvp => kvp.Value?.ToString() ?? string.Empty);
    }

    // Navigation
    public CustomForm? Form { get; set; }
    public Case? Case { get; set; }
}

public enum FieldType
{
    TEXT,
    EMAIL,
    PHONE,
    NUMBER,
    DATE,
    TEXTAREA,
    SELECT,
    RADIO,
    CHECKBOX,
    FILE,
    SIGNATURE
}
