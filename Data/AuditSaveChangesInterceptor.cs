using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Data;

/// <summary>
/// Intercepteur qui remplit automatiquement les champs d'audit
/// (CreatedAt, UpdatedAt, CreatedByUserId, UpdatedByUserId, TenantId)
/// et gère le soft delete à chaque SaveChanges.
/// </summary>
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        ApplyAuditFields(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditFields(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void ApplyAuditFields(DbContext? context)
    {
        if (context is null) return;

        var userId = GetCurrentUserId();
        var tenantId = GetCurrentTenantId();
        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries())
        {
            // Audit fields
            if (entry.Entity is AuditableEntity auditable)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditable.CreatedAt = now;
                        auditable.CreatedByUserId ??= userId;
                        break;
                    case EntityState.Modified:
                        auditable.UpdatedAt = now;
                        auditable.UpdatedByUserId ??= userId;
                        break;
                }
            }

            // Soft delete: intercepter les Delete et les transformer en Update
            if (entry.Entity is SoftDeletableEntity softDeletable
                && entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                softDeletable.IsDeleted = true;
                softDeletable.DeletedAt = now;
                softDeletable.DeletedByUserId = userId;
            }

            // TenantId auto-fill on creation
            if (entry.Entity is TenantEntity tenantEntity
                && entry.State == EntityState.Added
                && tenantEntity.TenantId == Guid.Empty
                && tenantId.HasValue)
            {
                tenantEntity.TenantId = tenantId.Value;
            }
        }
    }

    private Guid? GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("userId");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    private Guid? GetCurrentTenantId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenantId");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
