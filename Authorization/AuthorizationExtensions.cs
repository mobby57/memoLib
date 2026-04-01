using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace MemoLib.Api.Authorization;

public static class AuthorizationExtensions
{
    /// <summary>
    /// Vérifie si l'utilisateur a au moins le rôle spécifié dans la hiérarchie
    /// </summary>
    public static bool HasMinimumRole(this ClaimsPrincipal user, string minimumRole)
    {
        var roleHierarchy = new Dictionary<string, int>
        {
            { Roles.User, 1 },
            { Roles.Agent, 2 },
            { Roles.Manager, 3 },
            { Roles.Admin, 4 },
            { Roles.Owner, 5 }
        };
        
        var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrEmpty(userRole) || !roleHierarchy.ContainsKey(userRole))
        {
            return false;
        }
        
        if (!roleHierarchy.ContainsKey(minimumRole))
        {
            return false;
        }
        
        return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
    }
    
    /// <summary>
    /// Vérifie si l'utilisateur est propriétaire de la ressource ou a un rôle suffisant
    /// </summary>
    public static bool CanAccessResource(this ClaimsPrincipal user, Guid resourceUserId)
    {
        // OWNER et ADMIN peuvent tout voir
        if (user.IsInRole(Roles.Owner) || user.IsInRole(Roles.Admin))
        {
            return true;
        }
        
        // Vérifier si c'est sa propre ressource
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId == resourceUserId;
        }
        
        return false;
    }

    public static bool CanAccessResource(this ClaimsPrincipal user, Guid? resourceUserId)
    {
        if (!resourceUserId.HasValue)
        {
            return false;
        }

        return user.CanAccessResource(resourceUserId.Value);
    }
    
    /// <summary>
    /// Obtient le rôle de l'utilisateur
    /// </summary>
    public static string? GetUserRole(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Role)?.Value;
    }
    
    /// <summary>
    /// Vérifie si l'utilisateur est un manager ou supérieur
    /// </summary>
    public static bool IsManagerOrAbove(this ClaimsPrincipal user)
    {
        return user.HasMinimumRole(Roles.Manager);
    }
    
    /// <summary>
    /// Vérifie si l'utilisateur est un admin ou supérieur
    /// </summary>
    public static bool IsAdminOrAbove(this ClaimsPrincipal user)
    {
        return user.HasMinimumRole(Roles.Admin);
    }
    
    /// <summary>
    /// Tente d'obtenir l'ID de l'utilisateur actuel
    /// </summary>
    public static bool TryGetCurrentUserId(this ControllerBase controller, out Guid userId)
    {
        userId = Guid.Empty;
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out userId);
    }
}
