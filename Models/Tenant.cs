namespace MemoLib.Api.Models;

public class Tenant
{
    public Guid Id { get; set; }
    public string SectorId { get; set; } = string.Empty; // "legal", "medical", "consulting"
    public string DisplayName { get; set; } = string.Empty; // "LegalMemo", "MediMemo"
    public string ConfigJson { get; set; } = string.Empty; // Configuration complète
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; } = true;
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
    public string Type { get; set; } = "string"; // string, number, date, enum
    public string Label { get; set; } = string.Empty;
    public List<string>? Options { get; set; } // Pour type enum
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
