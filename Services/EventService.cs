using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class EventService
{
    private readonly MemoLibDbContext _db;

    public EventService(MemoLibDbContext db) => _db = db;

    public async Task<(bool Success, string Message, Guid? EventId, Guid? CaseId, bool CaseCreated)> IngestEventAsync(
        Guid userId, Guid sourceId, string externalId, DateTime occurredAt, string payload)
    {
        var sourceOwned = await _db.Sources.AnyAsync(s => s.Id == sourceId && s.UserId == userId);
        if (!sourceOwned)
            return (false, "Source not owned by user", null, null, false);

        var checksum = ComputeChecksum(payload);
        
        if (await _db.Events.AnyAsync(e => e.Checksum == checksum))
            return (true, "Duplicate ignored", null, null, false);

        var evt = new Event
        {
            Id = Guid.NewGuid(),
            SourceId = sourceId,
            ExternalId = externalId,
            Checksum = checksum,
            OccurredAt = occurredAt,
            IngestedAt = DateTime.UtcNow,
            RawPayload = payload,
            EventType = "generic",
            Severity = 3,
            TextForEmbedding = payload
        };

        _db.Events.Add(evt);
        await _db.SaveChangesAsync();

        var caseId = await FindOrCreateCaseAsync(userId, sourceId, externalId, occurredAt);
        var caseCreated = caseId.Item2;
        caseId = (caseId.Item1, false);

        _db.CaseEvents.Add(new CaseEvent { CaseId = caseId.Item1, EventId = evt.Id });
        await _db.SaveChangesAsync();

        await LogAuditAsync(userId, "EventIngested", payload);
        if (caseCreated)
            await LogAuditAsync(userId, "CaseCreated", caseId.Item1.ToString());
        await LogAuditAsync(userId, "EventAttached", $"{caseId.Item1}:{evt.Id}");

        await _db.SaveChangesAsync();

        return (true, "Event stored", evt.Id, caseId.Item1, caseCreated);
    }

    private async Task<(Guid, bool)> FindOrCreateCaseAsync(Guid userId, Guid sourceId, string externalId, DateTime occurredAt)
    {
        var hasExternalId = !string.IsNullOrWhiteSpace(externalId);

        if (hasExternalId)
        {
            var existingCaseId = await _db.CaseEvents
                .Join(_db.Events, ce => ce.EventId, e => e.Id, (ce, e) => new { ce.CaseId, e.ExternalId, e.SourceId })
                .Join(_db.Cases, x => x.CaseId, c => c.Id, (x, c) => new { x.CaseId, x.ExternalId, x.SourceId, c.UserId })
                .Where(x => x.UserId == userId && x.SourceId == sourceId && x.ExternalId == externalId)
                .Select(x => (Guid?)x.CaseId)
                .FirstOrDefaultAsync();

            if (existingCaseId.HasValue)
                return (existingCaseId.Value, false);
        }

        var caseTitle = hasExternalId ? $"Dossier {externalId}" : $"Dossier Event {occurredAt:yyyyMMdd-HHmmss}";
        var newCase = new Case
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = caseTitle,
            CreatedAt = DateTime.UtcNow
        };

        _db.Cases.Add(newCase);
        await _db.SaveChangesAsync();

        return (newCase.Id, true);
    }

    private async Task LogAuditAsync(Guid userId, string action, string metadata)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            Metadata = metadata,
            OccurredAt = DateTime.UtcNow
        });
        await Task.CompletedTask;
    }

    private static string ComputeChecksum(string payload) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));
}
