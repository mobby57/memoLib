using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Tenant : AuditableEntity
{
    public string SectorId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<User> Users { get; set; } = new List<User>();
}

public class SectorConfig
{
    public string SectorId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string BrandColor { get; set; } = "#1E40AF";
    public Dictionary<string, string> Terminology { get; set; } = new();
    public List<CustomFieldDefinition> CustomFields { get; set; } = new();
    public List<SectorTemplate> Templates { get; set; } = new();
    public ComplianceRules Compliance { get; set; } = new();
}

public class CustomFieldDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "string";
    public string Label { get; set; } = string.Empty;
    public List<string>? Options { get; set; }
}

public class SectorTemplate
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public class ComplianceRules
{
    public string DataRetention { get; set; } = "10 years";
    public string Encryption { get; set; } = "AES-256";
    public bool AuditLog { get; set; } = true;
    public bool HIPAA { get; set; } = false;
    public bool GDPR { get; set; } = true;
}
