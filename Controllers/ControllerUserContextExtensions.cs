using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace MemoLib.Api.Controllers;

public static class ControllerUserContextExtensions
{
    public static bool TryGetCurrentUserId(this ControllerBase controller, out Guid userId)
    {
        userId = Guid.Empty;

        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? controller.User.FindFirst("userId")?.Value;

        return !string.IsNullOrWhiteSpace(userIdClaim)
               && Guid.TryParse(userIdClaim, out userId);
    }
}
