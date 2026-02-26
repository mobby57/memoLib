namespace MemoLib.Api.Models;

public enum UserRole
{
    OWNER = 1,      // Propriétaire du cabinet
    PARTNER = 2,    // Associé
    LAWYER = 3,     // Avocat
    PARALEGAL = 4,  // Juriste
    SECRETARY = 5,  // Secrétaire
    INTERN = 6      // Stagiaire
}

public enum Permission
{
    // Cases
    VIEW_ALL_CASES = 1,
    VIEW_ASSIGNED_CASES = 2,
    CREATE_CASES = 3,
    EDIT_CASES = 4,
    DELETE_CASES = 5,
    ASSIGN_CASES = 6,
    
    // Clients
    VIEW_ALL_CLIENTS = 10,
    VIEW_ASSIGNED_CLIENTS = 11,
    CREATE_CLIENTS = 12,
    EDIT_CLIENTS = 13,
    DELETE_CLIENTS = 14,
    
    // Users
    MANAGE_USERS = 20,
    VIEW_USERS = 21,
    
    // System
    VIEW_AUDIT = 30,
    MANAGE_SETTINGS = 31,
    EXPORT_DATA = 32
}

public class UserInvitation
{
    public Guid Id { get; set; }
    public Guid InvitedByUserId { get; set; }
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    public string InvitationToken { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool IsAccepted { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public virtual User? InvitedBy { get; set; }
}

public class UserTeamMembership
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TeamOwnerId { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime JoinedAt { get; set; }
    
    public virtual User? User { get; set; }
    public virtual User? TeamOwner { get; set; }
}