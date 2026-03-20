namespace MemoLib.Api.Models.Base;

/// <summary>
/// Entité de base avec ID uniquement.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }
}

/// <summary>
/// Entité avec audit (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy).
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}

/// <summary>
/// Entité auditable + soft delete.
/// </summary>
public abstract class SoftDeletableEntity : AuditableEntity
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedByUserId { get; set; }
}

/// <summary>
/// Entité auditable + soft delete + isolation tenant.
/// Classe de base pour TOUTES les entités métier.
/// </summary>
public abstract class TenantEntity : SoftDeletableEntity
{
    public Guid TenantId { get; set; }
}
