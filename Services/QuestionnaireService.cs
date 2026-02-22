using MemoLib.Api.Services;
using MemoLib.Api.Models;
using MemoLib.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class QuestionnaireService
{
    private readonly MemoLibDbContext _context;

    public QuestionnaireService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<List<Questionnaire>> GetActiveQuestionnairesForEventAsync(string eventType, string? tags = null)
    {
        var query = _context.Questionnaires
            .Include(q => q.Questions.OrderBy(qu => qu.Order))
            .Where(q => q.IsActive && q.EventType == eventType);

        if (!string.IsNullOrEmpty(tags))
        {
            var tagList = tags.Split(',').Select(t => t.Trim()).ToList();
            query = query.Where(q => tagList.Any(tag => q.Tags!.Contains(tag)));
        }

        return await query.ToListAsync();
    }

    public async Task<QuestionnaireResponse> SaveResponseAsync(Guid questionnaireId, Guid caseId, Guid eventId, Guid userId, Dictionary<Guid, string> answers)
    {
        var response = new QuestionnaireResponse
        {
            Id = Guid.NewGuid(),
            QuestionnaireId = questionnaireId,
            CaseId = caseId,
            EventId = eventId,
            UserId = userId,
            CompletedAt = DateTime.UtcNow,
            Answers = answers.Select(a => new Answer
            {
                Id = Guid.NewGuid(),
                QuestionId = a.Key,
                Value = a.Value
            }).ToList()
        };

        _context.QuestionnaireResponses.Add(response);
        await _context.SaveChangesAsync();
        return response;
    }

    public async Task<bool> HasCompletedQuestionnaireAsync(Guid caseId, Guid eventId, Guid questionnaireId)
    {
        return await _context.QuestionnaireResponses
            .AnyAsync(r => r.CaseId == caseId && r.EventId == eventId && r.QuestionnaireId == questionnaireId);
    }

    public async Task<List<QuestionnaireResponse>> GetCaseResponsesAsync(Guid caseId)
    {
        return await _context.QuestionnaireResponses
            .Include(r => r.Answers)
            .Where(r => r.CaseId == caseId)
            .ToListAsync();
    }
}