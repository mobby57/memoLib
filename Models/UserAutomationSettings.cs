namespace MemoLib.Api.Models;

public class UserAutomationSettings
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    
    // Email Monitoring
    public bool AutoMonitorEmails { get; set; } = true;
    public int EmailCheckIntervalSeconds { get; set; } = 60;
    public bool AutoCreateCaseFromEmail { get; set; } = true;
    public bool AutoCreateClientFromEmail { get; set; } = true;
    public bool AutoExtractClientInfo { get; set; } = true;
    
    // Dossiers
    public bool AutoAssignCases { get; set; } = false;
    public Guid? DefaultAssignedUserId { get; set; }
    public bool AutoSetPriority { get; set; } = false;
    public int? DefaultPriority { get; set; }
    public bool AutoAddTags { get; set; } = false;
    public string? DefaultTags { get; set; } // JSON array
    
    // Notifications
    public bool EnableNotifications { get; set; } = true;
    public bool NotifyNewEmail { get; set; } = true;
    public bool NotifyCaseAssigned { get; set; } = true;
    public bool NotifyHighPriority { get; set; } = true;
    public bool NotifyDeadlineApproaching { get; set; } = true;
    
    // Communication
    public bool AutoForwardToSignal { get; set; } = false;
    public string? SignalPhoneNumber { get; set; }
    public bool AutoReplyEnabled { get; set; } = false;
    public string? AutoReplyMessage { get; set; }
    
    // Détection Doublons
    public bool AutoMergeDuplicateCases { get; set; } = false;
    public bool AutoMergeDuplicateClients { get; set; } = false;
    
    // Recherche & IA
    public bool EnableSemanticSearch { get; set; } = true;
    public bool EnableEmbeddings { get; set; } = true;
    
    // Sécurité
    public bool RequireApprovalForDelete { get; set; } = true;
    public bool RequireApprovalForExport { get; set; } = false;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
