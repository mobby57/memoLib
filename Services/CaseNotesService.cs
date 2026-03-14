using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class CaseNotesService
{
    private readonly MemoLibDbContext _context;

    public CaseNotesService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<List<CaseNote>> GetNotesAsync(Guid caseId, Guid userId)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);

        return await _context.CaseNotes
            .AsNoTracking()
            .Where(note => note.CaseId == caseId)
            .OrderByDescending(note => note.CreatedAt)
            .ToListAsync();
    }

    public async Task<CaseNote> CreateNoteAsync(Guid caseId, Guid userId, string content, bool isPrivate, IReadOnlyCollection<string>? mentions)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);

        var note = new CaseNote
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            AuthorId = userId,
            Content = content,
            Visibility = isPrivate ? "private" : "team",
            Mentions = mentions != null ? System.Text.Json.JsonSerializer.Serialize(mentions.Where(m => !string.IsNullOrWhiteSpace(m)).Distinct(StringComparer.OrdinalIgnoreCase).ToList()) : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.CaseNotes.Add(note);
        await _context.SaveChangesAsync();
        return note;
    }

    public async Task<CaseNote?> UpdateNoteAsync(Guid caseId, Guid noteId, Guid userId, string content, bool isPrivate, IReadOnlyCollection<string>? mentions)
    {
        var note = await _context.CaseNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CaseId == caseId && n.AuthorId == userId);

        if (note == null)
        {
            return null;
        }

        note.Content = content;
        note.Visibility = isPrivate ? "private" : "team";
        note.Mentions = mentions != null ? System.Text.Json.JsonSerializer.Serialize(mentions.Where(m => !string.IsNullOrWhiteSpace(m)).Distinct(StringComparer.OrdinalIgnoreCase).ToList()) : null;
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return note;
    }

    public async Task<bool> DeleteNoteAsync(Guid caseId, Guid noteId, Guid userId)
    {
        var note = await _context.CaseNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CaseId == caseId && n.AuthorId == userId);

        if (note == null)
        {
            return false;
        }

        _context.CaseNotes.Remove(note);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task EnsureCaseOwnershipAsync(Guid caseId, Guid userId)
    {
        var caseExists = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userId);
        if (!caseExists)
        {
            throw new KeyNotFoundException("Dossier introuvable");
        }
    }
}
