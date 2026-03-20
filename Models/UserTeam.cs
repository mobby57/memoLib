using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public enum UserRole
{
    OWNER = 1,
    PARTNER = 2,
    LAWYER = 3,
    PARALEGAL = 4,
    SECRETARY = 5,
    INTERN = 6
}

public enum Permission
{
    VIEW_ALL_CASES = 1,
    VIEW_ASSIGNED_CASES = 2,
    CREATE_CASES = 3,
    EDIT_CASES = 4,
    DELETE_CASES = 5,
    ASSIGN_CASES = 6,
    VIEW_ALL_CLIENTS = 10,
    VIEW_ASSIGNED_CLIENTS = 11,
    CREATE_CLIENTS = 12,
    EDIT_CLIENTS = 13,
    DELETE_CLIENTS = 14,
    MANAGE_USERS = 20,
    VIEW_USERS = 21,
    VIEW_AUDIT = 30,
    MANAGE_SETTINGS = 31,
    EXPORT_DATA = 32
}

public class UserInvitation : AuditableEntity
{
    public Guid InvitedByUserId { get; set; }
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }
    public string InvitationToken { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool IsAccepted { get; set; }

    // Navigation
    public virtual User? InvitedBy { get; set; }
}

public class UserTeamMembership : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid TeamOwnerId { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime JoinedAt { get; set; }

    // Navigation
    public virtual User? User { get; set; }
    public virtual User? TeamOwner { get; set; }
}
