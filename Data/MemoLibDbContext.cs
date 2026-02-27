using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MemoLib.Api.Models;
using System.Text.Json;

namespace MemoLib.Api.Data;

public class MemoLibDbContext : DbContext
{
    public MemoLibDbContext(DbContextOptions<MemoLibDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Source> Sources => Set<Source>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Case> Cases => Set<Case>();
    public DbSet<CaseEvent> CaseEvents => Set<CaseEvent>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<CaseShare> CaseShares => Set<CaseShare>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Questionnaire> Questionnaires => Set<Questionnaire>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionnaireResponse> QuestionnaireResponses => Set<QuestionnaireResponse>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<UserEmailConfig> UserEmailConfigs => Set<UserEmailConfig>();
    public DbSet<UserInvitation> UserInvitations => Set<UserInvitation>();
    public DbSet<UserTeamMembership> UserTeamMemberships => Set<UserTeamMembership>();
    public DbSet<SatisfactionSurvey> SatisfactionSurveys => Set<SatisfactionSurvey>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<ClientOnboardingTemplate> ClientOnboardingTemplates => Set<ClientOnboardingTemplate>();
    public DbSet<ClientOnboardingRequest> ClientOnboardingRequests => Set<ClientOnboardingRequest>();
    public DbSet<RoleNotification> RoleNotifications => Set<RoleNotification>();
    public DbSet<CaseNote> CaseNotes => Set<CaseNote>();
    public DbSet<CaseTask> CaseTasks => Set<CaseTask>();
    public DbSet<CaseDocument> CaseDocuments => Set<CaseDocument>();
    public DbSet<PhoneCall> PhoneCalls => Set<PhoneCall>();
    public DbSet<CustomForm> CustomForms => Set<CustomForm>();
    public DbSet<FormSubmission> FormSubmissions => Set<FormSubmission>();
    public DbSet<Automation> Automations => Set<Automation>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Integration> Integrations => Set<Integration>();
    public DbSet<TeamMessage> TeamMessages => Set<TeamMessage>();
    public DbSet<ExternalShare> ExternalShares => Set<ExternalShare>();
    public DbSet<UserAutomationSettings> UserAutomationSettings => Set<UserAutomationSettings>();
    public DbSet<PendingAction> PendingActions => Set<PendingAction>();
    public DbSet<CaseCollaborator> CaseCollaborators => Set<CaseCollaborator>();
    public DbSet<CaseActivity> CaseActivities => Set<CaseActivity>();
    public DbSet<CaseComment> CaseComments => Set<CaseComment>();
    public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
    public DbSet<TaskChecklistItem> TaskChecklistItems => Set<TaskChecklistItem>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Webhook> Webhooks => Set<Webhook>();
    public DbSet<WebhookLog> WebhookLogs => Set<WebhookLog>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<AdvancedTemplate> AdvancedTemplates => Set<AdvancedTemplate>();
    public DbSet<DocumentSignature> DocumentSignatures => Set<DocumentSignature>();
    public DbSet<SignatureRequest> SignatureRequests => Set<SignatureRequest>();
    public DbSet<DynamicForm> DynamicForms => Set<DynamicForm>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var jsonSerializerOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var stringListConverter = new ValueConverter<List<string>, string>(
            value => JsonSerializer.Serialize(value ?? new List<string>(), jsonSerializerOptions),
            value => JsonSerializer.Deserialize<List<string>>(value, jsonSerializerOptions) ?? new List<string>());

        var stringListComparer = new ValueComparer<List<string>>(
            (left, right) => JsonSerializer.Serialize(left ?? new List<string>(), jsonSerializerOptions) == JsonSerializer.Serialize(right ?? new List<string>(), jsonSerializerOptions),
            value => JsonSerializer.Serialize(value ?? new List<string>(), jsonSerializerOptions).GetHashCode(),
            value => value == null ? new List<string>() : value.ToList());

        modelBuilder.Entity<CaseEvent>()
            .HasKey(ce => new { ce.CaseId, ce.EventId });

        modelBuilder.Entity<CaseNote>()
            .Property(n => n.Mentions)
            .HasConversion(stringListConverter)
            .Metadata.SetValueComparer(stringListComparer);

        modelBuilder.Entity<CaseDocument>()
            .Property(d => d.Tags)
            .HasConversion(stringListConverter)
            .Metadata.SetValueComparer(stringListComparer);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Event>()
            .HasIndex(e => e.Checksum)
            .IsUnique();

        modelBuilder.Entity<Event>()
            .HasIndex(e => e.OccurredAt);

        modelBuilder.Entity<Event>()
            .HasIndex(e => new { e.SourceId, e.OccurredAt });

        modelBuilder.Entity<Case>()
            .HasIndex(c => c.UserId);

        modelBuilder.Entity<Case>()
            .HasIndex(c => c.Status);

        modelBuilder.Entity<Case>()
            .HasIndex(c => c.AssignedToUserId);

        modelBuilder.Entity<Client>()
            .HasIndex(c => c.UserId);

        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.UserId, a.OccurredAt });

        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        modelBuilder.Entity<CaseShare>()
            .HasIndex(cs => cs.CaseId);

        modelBuilder.Entity<CaseShare>()
            .HasIndex(cs => cs.SharedWithEmail);

        modelBuilder.Entity<Attachment>()
            .HasIndex(a => a.EventId);

        modelBuilder.Entity<Question>()
            .HasIndex(q => new { q.QuestionnaireId, q.Order });

        modelBuilder.Entity<QuestionnaireResponse>()
            .HasIndex(qr => new { qr.CaseId, qr.EventId });

        modelBuilder.Entity<Answer>()
            .HasIndex(a => a.ResponseId);

        modelBuilder.Entity<Tenant>()
            .HasIndex(t => new { t.SectorId, t.IsActive });

        modelBuilder.Entity<ClientOnboardingTemplate>()
            .HasIndex(t => new { t.UserId, t.IsActive });

        modelBuilder.Entity<ClientOnboardingRequest>()
            .HasIndex(r => r.AccessToken)
            .IsUnique();

        modelBuilder.Entity<ClientOnboardingRequest>()
            .HasIndex(r => new { r.OwnerUserId, r.Status, r.CreatedAt });

        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.SectorId)
            .IsUnique();

        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.IsActive);

        modelBuilder.Entity<RoleNotification>()
            .HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        modelBuilder.Entity<CaseNote>()
            .HasIndex(n => new { n.CaseId, n.CreatedAt });

        modelBuilder.Entity<CaseTask>()
            .HasIndex(t => new { t.CaseId, t.IsCompleted, t.DueDate });

        modelBuilder.Entity<CaseDocument>()
            .HasIndex(d => new { d.CaseId, d.Version });

        modelBuilder.Entity<PhoneCall>()
            .HasIndex(p => new { p.CaseId, p.StartTime });

        modelBuilder.Entity<TimeEntry>()
            .HasIndex(t => new { t.CaseId, t.UserId, t.StartTime });



        modelBuilder.Entity<CalendarEvent>()
            .HasIndex(e => new { e.UserId, e.StartTime });

        modelBuilder.Entity<CustomForm>()
            .HasIndex(f => new { f.UserId, f.IsActive });
        modelBuilder.Entity<CustomForm>()
            .Property(f => f.Fields)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<FormField>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<FormSubmission>()
            .HasIndex(s => new { s.FormId, s.SubmittedAt });
        modelBuilder.Entity<FormSubmission>()
            .Property(s => s.Responses)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<Automation>()
            .HasIndex(a => new { a.UserId, a.IsActive });
        modelBuilder.Entity<Automation>()
            .Property(a => a.TriggerConditions)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, jsonSerializerOptions) ?? new());
        modelBuilder.Entity<Automation>()
            .Property(a => a.ActionParams)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<Report>()
            .HasIndex(r => new { r.UserId, r.GeneratedAt });
        modelBuilder.Entity<Report>()
            .Property(r => r.Filters)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<Integration>()
            .HasIndex(i => new { i.UserId, i.Provider, i.IsActive });
        modelBuilder.Entity<Integration>()
            .Property(i => i.Settings)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<TeamMessage>()
            .HasIndex(m => new { m.ToUserId, m.IsRead, m.SentAt });

        modelBuilder.Entity<ExternalShare>()
            .HasIndex(s => s.ShareToken)
            .IsUnique();
        modelBuilder.Entity<ExternalShare>()
            .Property(s => s.DocumentIds)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<Guid>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<AdvancedTemplate>()
            .Property(t => t.Variables)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<TemplateVariable>>(v, jsonSerializerOptions) ?? new());
        modelBuilder.Entity<AdvancedTemplate>()
            .Property(t => t.Conditions)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<TemplateCondition>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<DocumentSignature>()
            .Property(s => s.SignatureRequests)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<SignatureRequest>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<DynamicForm>()
            .Property(f => f.Fields)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<FormField>>(v, jsonSerializerOptions) ?? new());

        modelBuilder.Entity<Models.FormSubmission>()
            .Property(s => s.Data)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, jsonSerializerOptions) ?? new());

        base.OnModelCreating(modelBuilder);
    }
}