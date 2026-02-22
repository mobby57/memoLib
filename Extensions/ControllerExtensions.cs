using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace MemoLib.Api;

public static class ControllerExtensions
{
    public static bool TryGetCurrentUserId(this ControllerBase controller, out Guid userId)
    {
        userId = Guid.Empty;
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out userId);
    }

    public static Guid GetUserId(this ControllerBase controller)
    {
        if (controller.TryGetCurrentUserId(out var userId))
            return userId;

        throw new UnauthorizedAccessException("Utilisateur non authentifié");
    }
}
