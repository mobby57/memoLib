using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Contracts;
using MemoLib.Api.Data;
using MemoLib.Api.Models;

namespace MemoLib.Api.Controllers;

[Authorize]
[ApiController]
[IgnoreAntiforgeryToken]
[Route("api/ingest")]
public class IngestionController : ControllerBase
{
    private readonly MemoLibDbContext _context;

    public IngestionController(MemoLibDbContext context)
    {
        _context = context;
    }

    private static string NormalizeForDedup(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var normalized = value.Trim().ToLowerInvariant();
        return System.Text.RegularExpressions.Regex.Replace(normalized, "\\s+", " ");
    }

    private static string BuildContentFingerprint(IngestEmailRequest request)
    {
        var from = NormalizeForDedup(request.From);
        var subject = NormalizeForDedup(request.Subject);
        var body = NormalizeForDedup(request.Body);
        return $"{from}|{subject}|{body}";
    }

    private static string NormalizeCaseTitle(string? subject)
    {
        var title = string.IsNullOrWhiteSpace(subject)
            ? $"Dossier {DateTime.UtcNow:yyyyMMdd-HHmmss}"
            : subject.Trim();

        return System.Text.RegularExpressions.Regex.Replace(title, "\\s+", " ").Trim();
    }

    private static Guid? TryExtractClientDbIdFromBody(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return null;

        var match = System.Text.RegularExpressions.Regex.Match(
            body,
            @"ClientDbId\s*:\s*([0-9a-fA-F-]{36})",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        if (!match.Success)
            return null;

        return Guid.TryParse(match.Groups[1].Value, out var parsed) ? parsed : null;
    }

    private async Task MarkEventAsDuplicateAttentionAsync(Guid eventId, string duplicateFlag)
    {
        var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        if (ev is null)
            return;

        ev.RequiresAttention = true;

        var flags = (ev.ValidationFlags ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        flags.Add(duplicateFlag);
        ev.ValidationFlags = string.Join(',', flags);

        await _context.SaveChangesAsync();
    }

    [HttpPost("email")]
    public async Task<IActionResult> IngestEmail([FromBody] IngestEmailRequest request)
    {
        if (!this.TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Utilisateur non authentifié" });

        var source = await _context.Sources
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (source is null)
            return BadRequest("No source configured.");

        var normalizedExternalId = NormalizeForDedup(request.ExternalId);

        if (!string.IsNullOrWhiteSpace(normalizedExternalId))
        {
            var duplicateByExternalId = await _context.Events
                .AsNoTracking()
                .Where(e => e.SourceId == source.Id && e.ExternalId.ToLower() == normalizedExternalId)
                .Select(e => new { e.Id, e.ExternalId })
                .FirstOrDefaultAsync();

            if (duplicateByExternalId is not null)
            {
                var existingCaseId = await _context.CaseEvents
                    .AsNoTracking()
                    .Where(ce => ce.EventId == duplicateByExternalId.Id)
                    .Select(ce => (Guid?)ce.CaseId)
                    .FirstOrDefaultAsync();

                await MarkEventAsDuplicateAttentionAsync(duplicateByExternalId.Id, "DUPLICATE_EXTERNAL_ID");

                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    EventId = duplicateByExternalId.Id,
                    Type = "WARNING",
                    Title = "Email doublon d\u00e9tect\u00e9 (ID externe)",
                    Message = $"Un email avec le m\u00eame ID externe '{request.ExternalId}' existe d\u00e9j\u00e0. V\u00e9rifiez s'il s'agit d'un renvoi l\u00e9gitime.",
                    ActionRequired = "REVIEW_DUPLICATE",
                    IsRead = false,
                    IsResolved = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Duplicate detected (same ExternalId)",
                    isDuplicate = true,
                    duplicateReason = "EXTERNAL_ID",
                    eventId = duplicateByExternalId.Id,
                    existingEventId = duplicateByExternalId.Id,
                    caseId = existingCaseId,
                    notificationCreated = true,
                    notificationId = notification.Id
                });
            }
        }

        var payload = System.Text.Json.JsonSerializer.Serialize(request);
        var contentFingerprint = BuildContentFingerprint(request);
        var checksumInput = $"{source.Id}|{contentFingerprint}";

        var checksum = Convert.ToBase64String(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(checksumInput)));

        var duplicateByContent = await _context.Events
            .AsNoTracking()
            .Where(e => e.SourceId == source.Id && e.Checksum == checksum)
            .Select(e => e.Id)
            .FirstOrDefaultAsync();

        if (duplicateByContent != Guid.Empty)
        {
            var existingCaseId = await _context.CaseEvents
                .AsNoTracking()
                .Where(ce => ce.EventId == duplicateByContent)
                .Select(ce => (Guid?)ce.CaseId)
                .FirstOrDefaultAsync();

            await MarkEventAsDuplicateAttentionAsync(duplicateByContent, "DUPLICATE_CONTENT");

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = duplicateByContent,
                Type = "WARNING",
                Title = "Email doublon d\u00e9tect\u00e9 (contenu identique)",
                Message = $"Un email avec un contenu identique existe d\u00e9j\u00e0. V\u00e9rifiez s'il s'agit d'un renvoi ou d'une erreur.",
                ActionRequired = "REVIEW_DUPLICATE",
                IsRead = false,
                IsResolved = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Duplicate detected (same normalized content)",
                isDuplicate = true,
                duplicateReason = "CONTENT",
                eventId = duplicateByContent,
                existingEventId = duplicateByContent,
                caseId = existingCaseId,
                notificationCreated = true,
                notificationId = notification.Id
            });
        }

        var validationFlags = new List<string>();
        var requiresAttention = false;

        if (string.IsNullOrWhiteSpace(request.From))
        {
            validationFlags.Add("MISSING_SENDER");
            requiresAttention = true;
        }

        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            validationFlags.Add("MISSING_SUBJECT");
            requiresAttention = true;
        }

        if (string.IsNullOrWhiteSpace(request.Body))
        {
            validationFlags.Add("EMPTY_BODY");
            requiresAttention = true;
        }

        if (request.Body?.Length > 10000)
        {
            validationFlags.Add("LARGE_EMAIL");
        }

        var ev = new Event
        {
            Id = Guid.NewGuid(),
            SourceId = source.Id,
            ExternalId = string.IsNullOrWhiteSpace(request.ExternalId)
                ? $"EMAIL-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}"
                : request.ExternalId.Trim(),
            Checksum = checksum,
            OccurredAt = request.OccurredAt,
            IngestedAt = DateTime.UtcNow,
            RawPayload = payload,
            EventType = "email",
            Severity = 3,
            ValidationFlags = validationFlags.Count > 0 ? string.Join(",", validationFlags) : null,
            RequiresAttention = requiresAttention
        };

        if (requiresAttention)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = ev.Id,
                Type = "WARNING",
                Title = "Email avec anomalie d\u00e9tect\u00e9",
                Message = $"Email re\u00e7u avec anomalies: {string.Join(", ", validationFlags)}. V\u00e9rifiez et d\u00e9cidez de l'action \u00e0 prendre.",
                ActionRequired = "REVIEW_EMAIL",
                IsRead = false,
                IsResolved = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        ev.TextForEmbedding =
            $"{request.From}\n" +
            $"{request.Subject}\n" +
            $"{request.Body}\n" +
            $"Type:{ev.EventType}\n" +
            $"Severity:{ev.Severity}";

        _context.Events.Add(ev);

        Guid caseId = Guid.Empty;
        var hasExternalId = !string.IsNullOrWhiteSpace(request.ExternalId);

        if (hasExternalId)
        {
            caseId = await _context.Events
                .Where(e => e.ExternalId == request.ExternalId && e.SourceId == source.Id)
                .Join(_context.CaseEvents,
                      e => e.Id,
                      ce => ce.EventId,
                      (e, ce) => ce.CaseId)
                .Join(_context.Cases,
                      caseId => caseId,
                      c => c.Id,
                      (caseId, c) => new { caseId, c.UserId })
                .Where(x => x.UserId == userId)
                .Select(x => x.caseId)
                .FirstOrDefaultAsync();
        }

        var caseCreated = false;
        var normalizedCaseTitle = NormalizeCaseTitle(request.Subject);

        var extractedClientDbId = TryExtractClientDbIdFromBody(request.Body);
        Guid? resolvedClientId = null;

        if (extractedClientDbId.HasValue)
        {
            var exists = await _context.Clients
                .AsNoTracking()
                .AnyAsync(c => c.Id == extractedClientDbId.Value && c.UserId == userId);

            if (exists)
                resolvedClientId = extractedClientDbId.Value;
        }

        if (!resolvedClientId.HasValue && !string.IsNullOrWhiteSpace(request.From))
        {
            var normalizedFrom = NormalizeForDedup(request.From);
            resolvedClientId = await _context.Clients
                .AsNoTracking()
                .Where(c => c.UserId == userId && c.Email.ToLower() == normalizedFrom)
                .Select(c => (Guid?)c.Id)
                .FirstOrDefaultAsync();
        }

        if (caseId == Guid.Empty)
        {
            var existingByClientAndTitle = await _context.Cases
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .Where(c => c.Title.ToLower() == normalizedCaseTitle.ToLower())
                .Where(c => c.ClientId == resolvedClientId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => (Guid?)c.Id)
                .FirstOrDefaultAsync();

            if (existingByClientAndTitle.HasValue)
            {
                caseId = existingByClientAndTitle.Value;
            }
            else
            {
                caseId = Guid.NewGuid();

                var newCase = new Case
                {
                    Id = caseId,
                    UserId = userId,
                    ClientId = resolvedClientId,
                    Title = normalizedCaseTitle,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Cases.Add(newCase);
                caseCreated = true;
            }
        }

        _context.CaseEvents.Add(new CaseEvent
        {
            CaseId = caseId,
            EventId = ev.Id
        });

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "EventIngested",
            Metadata = payload,
            OccurredAt = DateTime.UtcNow
        });

        if (caseCreated)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "CaseCreated",
                Metadata = caseId.ToString(),
                OccurredAt = DateTime.UtcNow
            });
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "EventAttached",
            Metadata = $"{caseId}:{ev.Id}",
            OccurredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Event stored.",
            isDuplicate = false,
            eventId = ev.Id,
            caseId,
            caseCreated,
            requiresAttention,
            validationFlags = validationFlags.ToArray()
        });
    }
}
