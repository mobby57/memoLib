using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class SignatureService
{
    private readonly MemoLibDbContext _context;

    public SignatureService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<DocumentSignature> CreateSignatureRequest(Guid documentId, Guid caseId, Guid userId, 
        string documentName, string documentUrl, List<SignatureRequest> signers)
    {
        var signature = new DocumentSignature
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            CaseId = caseId,
            UserId = userId,
            DocumentName = documentName,
            DocumentUrl = documentUrl,
            Status = SignatureStatus.PENDING,
            SignatureRequests = signers.Select((s, index) => new SignatureRequest
            {
                Id = Guid.NewGuid(),
                SignerName = s.SignerName,
                SignerEmail = s.SignerEmail,
                SignerPhone = s.SignerPhone,
                Order = index + 1,
                Status = SignatureStatus.PENDING,
                Token = GenerateSecureToken(),
                TokenExpiresAt = DateTime.UtcNow.AddDays(30)
            }).ToList()
        };

        _context.DocumentSignatures.Add(signature);
        await _context.SaveChangesAsync();

        return signature;
    }

    public async Task<SignatureRequest?> SignDocument(string token, string signatureData, string ipAddress)
    {
        var request = await _context.SignatureRequests
            .Include(r => r.DocumentSignature)
            .FirstOrDefaultAsync(r => r.Token == token && r.TokenExpiresAt > DateTime.UtcNow);

        if (request == null || request.Status == SignatureStatus.SIGNED)
            return null;

        request.SignatureData = signatureData;
        request.SignedAt = DateTime.UtcNow;
        request.IpAddress = ipAddress;
        request.Status = SignatureStatus.SIGNED;

        var allSigned = await _context.SignatureRequests
            .Where(r => r.DocumentSignatureId == request.DocumentSignatureId)
            .AllAsync(r => r.Status == SignatureStatus.SIGNED);

        if (allSigned)
        {
            var docSignature = await _context.DocumentSignatures.FindAsync(request.DocumentSignatureId);
            if (docSignature != null)
            {
                docSignature.Status = SignatureStatus.COMPLETED;
                docSignature.CompletedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return request;
    }

    private string GenerateSecureToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("/", "_").Replace("+", "-")[..22];
    }
}
