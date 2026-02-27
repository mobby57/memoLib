using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Extensions;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/signatures")]
public class SignaturesController : ControllerBase
{
    private readonly MemoLibDbContext _context;
    private readonly SignatureService _signatureService;

    public SignaturesController(MemoLibDbContext context, SignatureService signatureService)
    {
        _context = context;
        _signatureService = signatureService;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateSignatureRequest([FromBody] CreateSignatureRequest request)
    {
        var userId = this.GetUserId();
        
        var signature = await _signatureService.CreateSignatureRequest(
            request.DocumentId,
            request.CaseId,
            userId,
            request.DocumentName,
            request.DocumentUrl,
            request.Signers
        );

        return CreatedAtAction(nameof(GetSignature), new { id = signature.Id }, signature);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetSignature(Guid id)
    {
        var userId = this.GetUserId();
        var signature = await _context.DocumentSignatures
            .Include(s => s.SignatureRequests)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (signature == null)
            return NotFound();

        return Ok(signature);
    }

    [HttpGet("case/{caseId}")]
    [Authorize]
    public async Task<IActionResult> GetSignaturesByCase(Guid caseId)
    {
        var userId = this.GetUserId();
        var signatures = await _context.DocumentSignatures
            .Include(s => s.SignatureRequests)
            .Where(s => s.CaseId == caseId && s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(signatures);
    }

    [HttpPost("sign/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> SignDocument(string token, [FromBody] SignDocumentRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await _signatureService.SignDocument(token, request.SignatureData, ipAddress);

        if (result == null)
            return BadRequest(new { error = "Invalid or expired token" });

        return Ok(new { message = "Document signed successfully", signature = result });
    }

    [HttpGet("verify/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyToken(string token)
    {
        var request = await _context.SignatureRequests
            .FirstOrDefaultAsync(r => r.Token == token);

        if (request == null || request.TokenExpiresAt < DateTime.UtcNow)
            return NotFound(new { error = "Invalid or expired token" });

        var docSignature = await _context.DocumentSignatures.FindAsync(request.DocumentSignatureId);
        if (docSignature == null)
            return NotFound(new { error = "Document not found" });

        return Ok(new
        {
            documentName = docSignature.DocumentName,
            documentUrl = docSignature.DocumentUrl,
            signerName = request.SignerName,
            status = request.Status.ToString(),
            expiresAt = request.TokenExpiresAt
        });
    }
}

public class CreateSignatureRequest
{
    public Guid DocumentId { get; set; }
    public Guid CaseId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public List<SignatureRequest> Signers { get; set; } = new();
}

public class SignDocumentRequest
{
    public string SignatureData { get; set; } = string.Empty;
}
