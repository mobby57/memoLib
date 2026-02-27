using Microsoft.AspNetCore.Authorization;

namespace MemoLib.Api.Authorization;

public class ResourceOwnerRequirement : IAuthorizationRequirement
{
    public string ResourceIdParameter { get; }
    
    public ResourceOwnerRequirement(string resourceIdParameter = "id")
    {
        ResourceIdParameter = resourceIdParameter;
    }
}

public class ResourceOwnerHandler : AuthorizationHandler<ResourceOwnerRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    public ResourceOwnerHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ResourceOwnerRequirement requirement)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return Task.CompletedTask;
        }
        
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Task.CompletedTask;
        }
        
        // OWNER et ADMIN peuvent accéder à toutes les ressources
        if (context.User.IsInRole(Roles.Owner) || context.User.IsInRole(Roles.Admin))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }
        
        // Vérifier si l'utilisateur est propriétaire de la ressource
        var resourceUserId = httpContext.Items["ResourceUserId"]?.ToString();
        if (resourceUserId == userIdClaim)
        {
            context.Succeed(requirement);
        }
        
        return Task.CompletedTask;
    }
}
