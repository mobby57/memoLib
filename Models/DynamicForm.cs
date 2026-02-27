using System.ComponentModel.DataAnnotations.Schema;

namespace MemoLib.Api.Models;

public class DynamicForm
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<FormField> Fields { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; } // Public forms accessible without auth
    public string? PublicUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
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
    public List<string>? Options { get; set; } // For select, radio, checkbox
    public FieldValidation? Validation { get; set; }
    public FieldCondition? Condition { get; set; } // Show/hide based on other field
}

public class FieldValidation
{
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Pattern { get; set; } // Regex
    public int? Min { get; set; } // For numbers
    public int? Max { get; set; }
    public string? CustomMessage { get; set; }
}

public class FieldCondition
{
    public string DependsOnField { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public string Value { get; set; } = string.Empty;
}

public class FormSubmission
{
    public Guid Id { get; set; }
    public Guid FormId { get; set; }
    public Guid? CaseId { get; set; } // Auto-link to case if applicable
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
