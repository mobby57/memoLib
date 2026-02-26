using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Models;

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
    public DbSet<ClientOnboardingTemplate> ClientOnboardingTemplates => Set<ClientOnboardingTemplate>();
    public DbSet<ClientOnboardingRequest> ClientOnboardingRequests => Set<ClientOnboardingRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CaseEvent>()
            .HasKey(ce => new { ce.CaseId, ce.EventId });

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

        modelBuilder.Entity<ClientOnboardingTemplate>()
            .HasIndex(t => new { t.UserId, t.IsActive });

        modelBuilder.Entity<ClientOnboardingRequest>()
            .HasIndex(r => r.AccessToken)
            .IsUnique();

        modelBuilder.Entity<ClientOnboardingRequest>()
            .HasIndex(r => new { r.OwnerUserId, r.Status, r.CreatedAt });
    }
}