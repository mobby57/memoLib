using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class ClientOnboardingTemplate : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string NeedOptionsJson { get; set; } = "[]";
    public string RequiredDocumentsJson { get; set; } = "[]";
    public string ParticipantRolesJson { get; set; } = "[]";
    public string ExtraFieldsJson { get; set; } = "[]";
    public bool IsActive { get; set; } = true;

    // Navigation
    public User? User { get; set; }
    public ICollection<ClientOnboardingRequest> Requests { get; set; } = new List<ClientOnboardingRequest>();
}

public class ClientOnboardingRequest : AuditableEntity
{
    public Guid TemplateId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string ClientName { get; set; } = null!;
    public string ClientEmail { get; set; } = null!;
    public string AccessToken { get; set; } = null!;
    public string Status { get; set; } = "PENDING";
    public DateTime ExpiresAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? SelectedNeed { get; set; }
    public string ParticipantsJson { get; set; } = "[]";
    public string ProvidedDocumentsJson { get; set; } = "[]";
    public string AnswersJson { get; set; } = "{}";
    public Guid? CreatedCaseId { get; set; }

    // Navigation
    public ClientOnboardingTemplate? Template { get; set; }
    public User? OwnerUser { get; set; }
    public Case? CreatedCase { get; set; }
}
