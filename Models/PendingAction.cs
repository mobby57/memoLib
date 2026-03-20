using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class PendingAction : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid EventId { get; set; }
    public string EventType { get; set; } = null!;
    public string Status { get; set; } = "PENDING";

    // Données de l'événement
    public string From { get; set; } = null!;
    public string? FromName { get; set; }
    public string Subject { get; set; } = null!;
    public string Preview { get; set; } = null!;

    // Actions proposées par le système
    public bool SuggestCreateCase { get; set; }
    public string? SuggestedCaseTitle { get; set; }
    public bool SuggestCreateClient { get; set; }
    public string? SuggestedClientName { get; set; }
    public string? SuggestedClientPhone { get; set; }
    public string? SuggestedClientEmail { get; set; }
    public Guid? SuggestLinkToExistingCase { get; set; }
    public Guid? SuggestLinkToExistingClient { get; set; }

    // Décision utilisateur
    public bool UserCreateCase { get; set; }
    public string? UserCaseTitle { get; set; }
    public bool UserCreateClient { get; set; }
    public string? UserClientName { get; set; }
    public Guid? UserLinkToCaseId { get; set; }
    public Guid? UserLinkToClientId { get; set; }
    public Guid? UserAssignToUserId { get; set; }
    public int? UserPriority { get; set; }
    public string? UserTags { get; set; }
    public string? UserNotes { get; set; }

    // Actions rapides
    public bool UserMarkAsSpam { get; set; }
    public bool UserArchive { get; set; }
    public bool UserIgnore { get; set; }

    public DateTime? ProcessedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public Event? Event { get; set; }
}
