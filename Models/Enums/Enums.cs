namespace MemoLib.Api.Models.Enums;

public enum CaseStatusEnum
{
    OPEN,
    IN_PROGRESS,
    CLOSED
}

public enum CasePriority
{
    NONE = 0,
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    URGENT = 4,
    CRITICAL = 5
}

public enum NoteVisibility
{
    PRIVATE,
    TEAM,
    CLIENT
}

public enum CollaboratorRole
{
    VIEWER,
    COLLABORATOR,
    OWNER
}

public enum NotificationType
{
    INFO,
    WARNING,
    ERROR
}

public enum NotificationSeverity
{
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

public enum InvoiceStatus
{
    DRAFT,
    SENT,
    PAID,
    OVERDUE,
    CANCELLED
}

public enum SurveyStatus
{
    SENT,
    COMPLETED,
    EXPIRED
}

public enum CalendarEventType
{
    MEETING,
    DEADLINE,
    HEARING,
    CONSULTATION
}

public enum CalendarEventStatus
{
    SCHEDULED,
    COMPLETED,
    CANCELLED
}

public enum PhoneCallDirection
{
    INCOMING,
    OUTGOING
}

public enum OnboardingRequestStatus
{
    PENDING,
    SUBMITTED,
    EXPIRED
}

public enum IntakeSubmissionStatus
{
    PENDING,
    REVIEWED,
    APPROVED
}

public enum PendingActionStatus
{
    PENDING,
    APPROVED,
    REJECTED,
    PROCESSED
}

public enum DocumentCategory
{
    GENERAL,
    EVIDENCE,
    CONTRACT,
    COURT_FILING
}

public enum WorkspaceParticipantType
{
    CLIENT,
    LAWYER,
    JUDGE,
    SECRETARY,
    EXPERT
}

public enum ActivityType
{
    CREATED,
    STATUS_CHANGED,
    PRIORITY_CHANGED,
    COMMENT_ADDED,
    DOCUMENT_UPLOADED,
    ASSIGNED,
    TAG_ADDED,
    TAG_REMOVED,
    NOTE_ADDED,
    TASK_COMPLETED,
    CLOSED,
    REOPENED
}
