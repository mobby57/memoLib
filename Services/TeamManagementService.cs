using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace MemoLib.Api.Services;

public class TeamManagementService
{
    private readonly MemoLibDbContext _context;
    private readonly IConfiguration _configuration;

    public TeamManagementService(MemoLibDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<string> InviteUserAsync(Guid ownerId, string email, UserRole role)
    {
        var token = GenerateInvitationToken();
        
        var invitation = new UserInvitation
        {
            Id = Guid.NewGuid(),
            InvitedByUserId = ownerId,
            Email = email.ToLower(),
            Role = role,
            InvitationToken = token,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.UserInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        return token;
    }

    public async Task<bool> AcceptInvitationAsync(string token, Guid newUserId)
    {
        var invitation = await _context.UserInvitations
            .FirstOrDefaultAsync(i => i.InvitationToken == token && !i.IsAccepted && i.ExpiresAt > DateTime.UtcNow);

        if (invitation == null) return false;

        var membership = new UserTeamMembership
        {
            Id = Guid.NewGuid(),
            UserId = newUserId,
            TeamOwnerId = invitation.InvitedByUserId,
            Role = invitation.Role,
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        };

        _context.UserTeamMemberships.Add(membership);
        invitation.IsAccepted = true;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Permission>> GetUserPermissionsAsync(Guid userId, Guid? teamOwnerId = null)
    {
        var permissions = new List<Permission>();

        // Si c'est le propriétaire de son propre système
        if (teamOwnerId == null || teamOwnerId == userId)
        {
            return Enum.GetValues<Permission>().ToList(); // Toutes les permissions
        }

        var membership = await _context.UserTeamMemberships
            .FirstOrDefaultAsync(m => m.UserId == userId && m.TeamOwnerId == teamOwnerId && m.IsActive);

        if (membership == null) return permissions;

        permissions.AddRange(membership.Role switch
        {
            UserRole.PARTNER => new[]
            {
                Permission.VIEW_ALL_CASES, Permission.CREATE_CASES, Permission.EDIT_CASES, Permission.ASSIGN_CASES,
                Permission.VIEW_ALL_CLIENTS, Permission.CREATE_CLIENTS, Permission.EDIT_CLIENTS,
                Permission.VIEW_USERS, Permission.VIEW_AUDIT, Permission.EXPORT_DATA
            },
            UserRole.LAWYER => new[]
            {
                Permission.VIEW_ASSIGNED_CASES, Permission.CREATE_CASES, Permission.EDIT_CASES,
                Permission.VIEW_ASSIGNED_CLIENTS, Permission.CREATE_CLIENTS, Permission.EDIT_CLIENTS
            },
            UserRole.PARALEGAL => new[]
            {
                Permission.VIEW_ASSIGNED_CASES, Permission.EDIT_CASES,
                Permission.VIEW_ASSIGNED_CLIENTS, Permission.EDIT_CLIENTS
            },
            UserRole.SECRETARY => new[]
            {
                Permission.VIEW_ASSIGNED_CASES, Permission.VIEW_ASSIGNED_CLIENTS
            },
            UserRole.INTERN => new[]
            {
                Permission.VIEW_ASSIGNED_CASES
            },
            _ => Array.Empty<Permission>()
        });

        return permissions;
    }

    public async Task<bool> HasPermissionAsync(Guid userId, Permission permission, Guid? teamOwnerId = null)
    {
        var permissions = await GetUserPermissionsAsync(userId, teamOwnerId);
        return permissions.Contains(permission);
    }

    private static string GenerateInvitationToken()
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}