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
    }
}