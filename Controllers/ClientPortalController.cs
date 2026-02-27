using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Configuration;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Security.Claims;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/client/portal")]
[Authorize]
public class ClientPortalController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public ClientPortalController(MemoLibDbContext context)
    {
        _context = context;
    }

    [HttpGet("my-cases")]
    public async Task<IActionResult> GetMyCases()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

        if (!RbacConfig.HasPermission(userRole, RbacConfig.PortailClient.ViewOwnCases))
            return Forbid();

        var cases = await _context.Cases
            .Where(c => c.ClientId == userId || c.UserId == userId)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Status,
                c.CreatedAt,
                c.UpdatedAt,
                c.Priority,
                c.DueDate
            })
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        return Ok(cases);
    }

    [HttpGet("case/{caseId}")]
    public async Task<IActionResult> GetCaseDetail(Guid caseId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

        if (!RbacConfig.HasPermission(userRole, RbacConfig.PortailClient.ViewTimeline))
            return Forbid();

        var caseData = await _context.Cases
            .Where(c => c.Id == caseId && (c.ClientId == userId || c.UserId == userId))
            .FirstOrDefaultAsync();

        if (caseData == null)
            return NotFound();

        var timeline = await _context.CaseEvents
            .Where(e => e.CaseId == caseId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new TimelineEvent
            {
                Id = e.Id,
                Type = e.Type,
                Description = e.Description ?? "",
                CreatedAt = e.CreatedAt,
                VisibleToClient = true
            })
            .ToListAsync();

        var nextActions = new List<NextAction>();
        
        if (caseData.Status == "PENDING_DOCUMENTS")
        {
            nextActions.Add(new NextAction
            {
                Action = "Upload documents",
                Description = "Veuillez fournir les documents manquants",
                IsClientAction = true
            });
        }

        var result = new ClientPortalView
        {
            CaseId = caseData.Id,
            Title = caseData.Title,
            Status = caseData.Status,
            CreatedAt = caseData.CreatedAt,
            UpdatedAt = caseData.UpdatedAt,
            Priority = caseData.Priority,
            DueDate = caseData.DueDate,
            Timeline = timeline,
            NextActions = nextActions
        };

        return Ok(result);
    }

    [HttpGet("case/{caseId}/next-actions")]
    public async Task<IActionResult> GetNextActions(Guid caseId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

        if (!RbacConfig.HasPermission(userRole, RbacConfig.PortailClient.ViewNextActions))
            return Forbid();

        var caseData = await _context.Cases
            .Where(c => c.Id == caseId && (c.ClientId == userId || c.UserId == userId))
            .FirstOrDefaultAsync();

        if (caseData == null)
            return NotFound();

        var actions = new List<NextAction>();

        if (caseData.Status == "PENDING_DOCUMENTS")
        {
            actions.Add(new NextAction
            {
                Action = "Upload documents",
                Description = "Documents requis pour avancer le dossier",
                IsClientAction = true
            });
        }

        if (caseData.Status == "PENDING_PAYMENT")
        {
            actions.Add(new NextAction
            {
                Action = "Payer facture",
                Description = "Facture en attente de règlement",
                IsClientAction = true
            });
        }

        return Ok(actions);
    }
}
