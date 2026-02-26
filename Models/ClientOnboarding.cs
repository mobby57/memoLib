namespace MemoLib.Api.Models;

public class ClientOnboardingTemplate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string NeedOptionsJson { get; set; } = "[]";
    public string RequiredDocumentsJson { get; set; } = "[]";
    public string ParticipantRolesJson { get; set; } = "[]";
    public string ExtraFieldsJson { get; set; } = "[]";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ClientOnboardingRequest
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string ClientName { get; set; } = null!;
    public string ClientEmail { get; set; } = null!;
    public string AccessToken { get; set; } = null!;
    public string Status { get; set; } = "PENDING"; // PENDING, SUBMITTED, EXPIRED
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? SelectedNeed { get; set; }
    public string ParticipantsJson { get; set; } = "[]";
    public string ProvidedDocumentsJson { get; set; } = "[]";
    public string AnswersJson { get; set; } = "{}";
    public Guid? CreatedCaseId { get; set; }
}