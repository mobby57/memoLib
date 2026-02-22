using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;
using MemoLib.Api.Models;
using MemoLib.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuestionnaireController : ControllerBase
{
    private readonly QuestionnaireService _questionnaireService;
    private readonly MemoLibDbContext _context;

    public QuestionnaireController(QuestionnaireService questionnaireService, MemoLibDbContext context)
    {
        _questionnaireService = questionnaireService;
        _context = context;
    }

    [HttpGet("for-event/{eventId}")]
    public async Task<IActionResult> GetQuestionnairesForEvent(Guid eventId)
    {
        var eventEntity = await _context.Events.FindAsync(eventId);
        if (eventEntity == null) return NotFound();

        var caseEvent = await _context.CaseEvents.FirstOrDefaultAsync(ce => ce.EventId == eventId);
        if (caseEvent == null) return NotFound();

        var caseEntity = await _context.Cases.FindAsync(caseEvent.CaseId);
        
        var questionnaires = await _questionnaireService.GetActiveQuestionnairesForEventAsync(
            eventEntity.EventType ?? "EMAIL", 
            caseEntity?.Tags
        );

        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        
        var result = new List<object>();
        foreach (var q in questionnaires)
        {
            var completed = await _questionnaireService.HasCompletedQuestionnaireAsync(
                caseEvent.CaseId, eventId, q.Id);
            
            result.Add(new
            {
                q.Id,
                q.Name,
                q.Description,
                Questions = q.Questions.Select(qu => new
                {
                    qu.Id,
                    qu.Text,
                    qu.Type,
                    Options = string.IsNullOrEmpty(qu.Options) ? null : System.Text.Json.JsonSerializer.Deserialize<string[]>(qu.Options),
                    qu.IsRequired,
                    qu.Order
                }),
                IsCompleted = completed
            });
        }

        return Ok(result);
    }

    [HttpPost("response")]
    public async Task<IActionResult> SubmitResponse([FromBody] SubmitResponseRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("userId")!.Value);
        
        var response = await _questionnaireService.SaveResponseAsync(
            request.QuestionnaireId,
            request.CaseId,
            request.EventId,
            userId,
            request.Answers
        );

        return Ok(new { ResponseId = response.Id });
    }

    [HttpGet("case/{caseId}/responses")]
    public async Task<IActionResult> GetCaseResponses(Guid caseId)
    {
        var responses = await _questionnaireService.GetCaseResponsesAsync(caseId);
        
        var result = responses.Select(r => new
        {
            r.Id,
            r.QuestionnaireId,
            r.EventId,
            r.CompletedAt,
            Answers = r.Answers.Select(a => new
            {
                a.QuestionId,
                a.Value
            })
        });

        return Ok(result);
    }
}

public class SubmitResponseRequest
{
    public Guid QuestionnaireId { get; set; }
    public Guid CaseId { get; set; }
    public Guid EventId { get; set; }
    public Dictionary<Guid, string> Answers { get; set; } = new();
}