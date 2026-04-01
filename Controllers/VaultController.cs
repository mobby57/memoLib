using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VaultController : ControllerBase
{
    private readonly VaultService _vaultService;

    public VaultController(VaultService vaultService)
    {
        _vaultService = vaultService;
    }

    [HttpPost("store")]
    public async Task<IActionResult> StoreSecret([FromBody] StoreSecretRequest request)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr))
        {
            var allClaims = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
            return Unauthorized(new { message = "Claim NameIdentifier manquant", claims = allClaims });
        }
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = $"UserId invalide: {userIdStr}" });
            
        var result = await _vaultService.StoreSecretAsync(userId, request.Key, request.Value, request.Category);
        return Ok(new { message = result });
    }

    [HttpGet("get/{key}")]
    public async Task<IActionResult> GetSecret(string key)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Non authentifié" });
            
        var value = await _vaultService.GetSecretAsync(userId, key);
        
        if (value == null)
            return NotFound(new { message = "Secret non trouvé" });

        return Ok(new { key, value });
    }

    [HttpGet("list")]
    public async Task<IActionResult> ListSecrets()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Non authentifié" });
            
        var secrets = await _vaultService.ListSecretsAsync(userId);
        return Ok(secrets);
    }

    [HttpDelete("delete/{key}")]
    public async Task<IActionResult> DeleteSecret(string key)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Non authentifié" });
            
        var deleted = await _vaultService.DeleteSecretAsync(userId, key);
        
        if (!deleted)
            return NotFound(new { message = "Secret non trouvé" });

        return Ok(new { message = "Secret supprimé" });
    }
}

public record StoreSecretRequest(string Key, string Value, string Category = "General");
