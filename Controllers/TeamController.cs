using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/team")]
public class TeamController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly TeamManagementService _teamService;

    public TeamController(MemoLibDbContext context, TeamManagementService teamService)
    {
        _context = context;
        _teamService = teamService;
    }

    [HttpPost("invite")]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        if (!await _teamService.HasPermissionAsync(userId, Permission.MANAGE_USERS))
            return Forbid("Permissions insuffisantes");

        var token = await _teamService.InviteUserAsync(userId, request.Email, request.Role);
        
        var inviteUrl = $"{Request.Scheme}://{Request.Host}/api/team/accept?token={token}";
        
        return Ok(new { 
            message = "Invitation envoyée", 
            token, 
            inviteUrl,
            role = request.Role.ToString(),
            expiresAt = DateTime.UtcNow.AddDays(7)
        });
    }

    [HttpPost("accept")]
    [AllowAnonymous]
    public async Task<IActionResult> AcceptInvitation([FromQuery] string token, [FromBody] AcceptInvitationRequest request)
    {
        var invitation = await _context.UserInvitations
            .Include(i => i.InvitedBy)
            .FirstOrDefaultAsync(i => i.InvitationToken == token && !i.IsAccepted && i.ExpiresAt > DateTime.UtcNow);

        if (invitation == null)
            return BadRequest("Invitation invalide ou expirée");

        // Créer le compte utilisateur
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = invitation.Email,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        var success = await _teamService.AcceptInvitationAsync(token, user.Id);
        if (!success)
            return BadRequest("Erreur lors de l'acceptation");

        return Ok(new { 
            message = "Invitation acceptée", 
            userId = user.Id,
            role = invitation.Role.ToString(),
            teamOwner = invitation.InvitedBy?.Name ?? invitation.InvitedBy?.Email
        });
    }

    [HttpGet("members")]
    public async Task<IActionResult> GetTeamMembers()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var members = await _context.UserTeamMemberships
            .Where(m => m.TeamOwnerId == userId && m.IsActive)
            .Include(m => m.User)
            .Select(m => new
            {
                m.Id,
                m.Role,
                m.JoinedAt,
                User = new { m.User!.Name, m.User.Email }
            })
            .ToListAsync();

        var pendingInvitations = await _context.UserInvitations
            .Where(i => i.InvitedByUserId == userId && !i.IsAccepted && i.ExpiresAt > DateTime.UtcNow)
            .Select(i => new
            {
                i.Id,
                i.Email,
                i.Role,
                i.CreatedAt,
                i.ExpiresAt
            })
            .ToListAsync();

        return Ok(new { members, pendingInvitations });
    }

    [HttpPatch("members/{memberId}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid memberId, [FromBody] UpdateRoleRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        if (!await _teamService.HasPermissionAsync(userId, Permission.MANAGE_USERS))
            return Forbid();

        var membership = await _context.UserTeamMemberships
            .FirstOrDefaultAsync(m => m.Id == memberId && m.TeamOwnerId == userId);

        if (membership == null)
            return NotFound();

        membership.Role = request.Role;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rôle mis à jour", role = request.Role.ToString() });
    }

    [HttpDelete("members/{memberId}")]
    public async Task<IActionResult> RemoveMember(Guid memberId)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        if (!await _teamService.HasPermissionAsync(userId, Permission.MANAGE_USERS))
            return Forbid();

        var membership = await _context.UserTeamMemberships
            .FirstOrDefaultAsync(m => m.Id == memberId && m.TeamOwnerId == userId);

        if (membership == null)
            return NotFound();

        membership.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Membre retiré de l'équipe" });
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized();

        var permissions = await _teamService.GetUserPermissionsAsync(userId);
        return Ok(new { permissions = permissions.Select(p => p.ToString()).ToArray() });
    }
}

public record InviteUserRequest(string Email, UserRole Role);
public record AcceptInvitationRequest(string Name);
public record UpdateRoleRequest(UserRole Role);