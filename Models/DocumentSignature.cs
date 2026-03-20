using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class DocumentSignature : TenantEntity
{
    public Guid DocumentId { get; set; }
    public Guid CaseId { get; set; }
    public Guid UserId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public List<SignatureRequest> SignatureRequests { get; set; } = new();
    public SignatureStatus Status { get; set; } = SignatureStatus.PENDING;
    public DateTime? CompletedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? AuditTrail { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? User { get; set; }
}

public class SignatureRequest
{
    public Guid Id { get; set; }
    public Guid DocumentSignatureId { get; set; }
    public string SignerName { get; set; } = string.Empty;
    public string SignerEmail { get; set; } = string.Empty;
    public string? SignerPhone { get; set; }
    public int Order { get; set; }
    public SignatureStatus Status { get; set; } = SignatureStatus.PENDING;
    public string? SignatureData { get; set; }
    public DateTime? SignedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? Token { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public DocumentSignature? DocumentSignature { get; set; }
}

public enum SignatureStatus
{
    PENDING,
    SENT,
    VIEWED,
    SIGNED,
    DECLINED,
    EXPIRED,
    COMPLETED
}
