using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class CaseDocumentsService
{
    private const long MaxUploadBytes = 15 * 1024 * 1024;

    private readonly MemoLibDbContext _context;
    private readonly string _uploadPath;

    public CaseDocumentsService(MemoLibDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _uploadPath = Path.Combine(environment.ContentRootPath, "uploads", "documents");
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<List<CaseDocument>> GetDocumentsAsync(Guid caseId, Guid userId)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);

        return await _context.CaseDocuments
            .AsNoTracking()
            .Where(document => document.CaseId == caseId)
            .OrderByDescending(document => document.UploadedAt)
            .ToListAsync();
    }

    public async Task<CaseDocument> UploadDocumentAsync(Guid caseId, Guid userId, IFormFile file, string? category, IReadOnlyCollection<string>? tags)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);
        ValidateUpload(file);

        var originalFileName = Path.GetFileName(file.FileName);
        var storageFileName = $"{Guid.NewGuid():N}_{originalFileName}";
        var absolutePath = Path.Combine(_uploadPath, storageFileName);

        await using (var stream = new FileStream(absolutePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var document = new CaseDocument
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            FileName = originalFileName,
            FilePath = absolutePath,
            FileSize = file.Length,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            Category = category,
            Tags = tags?.Where(t => !string.IsNullOrWhiteSpace(t)).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? new List<string>()
        };

        _context.CaseDocuments.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<(CaseDocument? Document, byte[]? FileBytes)> DownloadDocumentAsync(Guid caseId, Guid documentId, Guid userId)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);

        var document = await _context.CaseDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId && d.CaseId == caseId);

        if (document == null || !File.Exists(document.FilePath))
        {
            return (null, null);
        }

        var fileBytes = await File.ReadAllBytesAsync(document.FilePath);
        return (document, fileBytes);
    }

    public async Task<CaseDocument?> CreateVersionAsync(Guid caseId, Guid parentDocumentId, Guid userId, IFormFile file)
    {
        await EnsureCaseOwnershipAsync(caseId, userId);
        ValidateUpload(file);

        var parentDocument = await _context.CaseDocuments
            .FirstOrDefaultAsync(d => d.Id == parentDocumentId && d.CaseId == caseId);

        if (parentDocument == null)
        {
            return null;
        }

        var originalFileName = Path.GetFileName(file.FileName);
        var storageFileName = $"{Guid.NewGuid():N}_{originalFileName}";
        var absolutePath = Path.Combine(_uploadPath, storageFileName);

        await using (var stream = new FileStream(absolutePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var version = new CaseDocument
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            FileName = originalFileName,
            FilePath = absolutePath,
            FileSize = file.Length,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            Version = parentDocument.Version + 1,
            ParentDocumentId = parentDocument.Id,
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            Category = parentDocument.Category,
            Tags = parentDocument.Tags
        };

        _context.CaseDocuments.Add(version);
        await _context.SaveChangesAsync();
        return version;
    }

    private static void ValidateUpload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Aucun fichier fourni.");
        }

        if (file.Length > MaxUploadBytes)
        {
            throw new ArgumentException("Le fichier dépasse la taille maximale autorisée (15 Mo).");
        }
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
