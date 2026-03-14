using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace MemoLib.Api.Extensions;

public static class ControllerExtensions
{
    public static Guid GetUserId(this ControllerBase controller)
    {
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("User ID not found in claims");
        return userId;
    }

    public static bool TryGetCurrentUserId(this ControllerBase controller, out Guid userId)
    {
        userId = Guid.Empty;
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out userId);
    }

    public static bool IsManagerOrAbove(this ClaimsPrincipal user)
    {
        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        return role is "MANAGER" or "ADMIN" or "OWNER";
    }

    public static bool CanAccessResource(this ClaimsPrincipal user, Guid resourceOwnerId)
    {
        if (user.IsManagerOrAbove()) return true;
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) && userId == resourceOwnerId;
    }
}
