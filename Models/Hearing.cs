using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class Hearing : TenantEntity
{
    public Guid CaseId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    public DateTime Date { get; set; }
    public TimeSpan? StartTime { get; set; }
    public string? Duration { get; set; }

    public string Jurisdiction { get; set; } = null!;
    public string? Chamber { get; set; }
    public string? RoleNumber { get; set; }
    public string? CourtAddress { get; set; }

    public HearingType Type { get; set; } = HearingType.Audience;
    public HearingStatus Status { get; set; } = HearingStatus.Scheduled;

    public string? OpposingParty { get; set; }
    public string? OpposingLawyer { get; set; }
    public string? JudgeName { get; set; }

    public string? DocumentsToProvide { get; set; }
    public string? Notes { get; set; }
    public string? Outcome { get; set; }

    public bool ReminderJ7Sent { get; set; }
    public bool ReminderJ1Sent { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public User? AssignedTo { get; set; }
}

public enum HearingType
{
    Audience,
    MiseEnEtat,
    Plaidoirie,
    Delibere,
    Mediation,
    Conciliation,
    RefereLibertes,
    Expertise,
    Confrontation
}

public enum HearingStatus
{
    Scheduled,
    Confirmed,
    Postponed,
    Completed,
    Cancelled
}
