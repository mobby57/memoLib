using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class ClientIntakeService
{
    private readonly MemoLibDbContext _context;

    public ClientIntakeService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<ClientIntakeForm> CreateFormTemplateAsync(Guid userId, ClientIntakeForm form)
    {
        form.Id = Guid.NewGuid();
        form.UserId = userId;
        form.CreatedAt = DateTime.UtcNow;

        _context.ClientIntakeForms.Add(form);
        await _context.SaveChangesAsync();

        return form;
    }

    public async Task<List<ClientIntakeForm>> GetUserFormsAsync(Guid userId)
    {
        return await _context.ClientIntakeForms
            .Where(f => f.UserId == userId && f.IsActive)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClientIntakeForm?> GetFormByIdAsync(Guid formId)
    {
        return await _context.ClientIntakeForms.FindAsync(formId);
    }

    public async Task<ClientIntakeSubmission> SubmitFormAsync(ClientIntakeSubmission submission)
    {
        submission.Id = Guid.NewGuid();
        submission.SubmittedAt = DateTime.UtcNow;

        _context.ClientIntakeSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return submission;
    }

    public async Task<List<ClientIntakeSubmission>> GetPendingSubmissionsAsync(Guid userId)
    {
        var userForms = await _context.ClientIntakeForms
            .Where(f => f.UserId == userId)
            .Select(f => f.Id)
            .ToListAsync();

        return await _context.ClientIntakeSubmissions
            .Where(s => userForms.Contains(s.FormId) && s.Status == "PENDING")
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
    }
}

