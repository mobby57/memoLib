using Microsoft.Data.Sqlite;

namespace MemoLib.Api.Services;

public interface IPipelineWorkflowStore
{
    Task<PipelineExecutionRecord> StartExecutionAsync(string tenantId, string emailId, string workflowName, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PipelineExecutionRecord>> ListExecutionsAsync(string tenantId, int limit, int offset, CancellationToken cancellationToken = default);
    Task<PipelineExecutionRecord?> GetExecutionAsync(string tenantId, string executionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PipelineTransitionRecord>> GetTransitionsAsync(string tenantId, string executionId, CancellationToken cancellationToken = default);
    Task<PipelineReviewResult?> ApplyReviewAsync(
        string tenantId,
        string executionId,
        string decision,
        string reviewedByUserId,
        string? notes,
        CancellationToken cancellationToken = default);
}

public sealed class PipelineWorkflowStore : IPipelineWorkflowStore
{
    private readonly string _connectionString;
    private readonly ILogger<PipelineWorkflowStore> _logger;

    public PipelineWorkflowStore(IConfiguration configuration, ILogger<PipelineWorkflowStore> logger)
    {
        _connectionString = configuration.GetConnectionString("Default") ?? "Data Source=memolib.db";
        _logger = logger;
    }

    public async Task<PipelineExecutionRecord> StartExecutionAsync(string tenantId, string emailId, string workflowName, CancellationToken cancellationToken = default)
    {
        await EnsureTablesAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var execution = new PipelineExecutionRecord
        {
            ExecutionId = Guid.NewGuid().ToString("N"),
            TenantId = tenantId,
            EmailId = emailId,
            WorkflowName = workflowName,
            State = "RECEIVED",
            StartedAtUtc = now,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        using var transaction = connection.BeginTransaction();
        await InsertExecutionAsync(connection, execution, cancellationToken);
        await InsertTransitionAsync(connection, new PipelineTransitionRecord
        {
            TransitionId = Guid.NewGuid().ToString("N"),
            ExecutionId = execution.ExecutionId,
            TenantId = tenantId,
            FromState = null,
            ToState = "RECEIVED",
            Reason = "workflow-start",
            ActorType = "system",
            ActorId = null,
            Notes = null,
            CreatedAtUtc = now,
        }, cancellationToken);
        transaction.Commit();

        return execution;
    }

    public async Task<PipelineExecutionRecord?> GetExecutionAsync(string tenantId, string executionId, CancellationToken cancellationToken = default)
    {
        await EnsureTablesAsync(cancellationToken);

        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT execution_id, tenant_id, email_id, workflow_name, state, started_at_utc, ended_at_utc, related_case_id, created_at_utc, updated_at_utc
FROM workflow_executions
WHERE tenant_id = $tenantId AND execution_id = $executionId
LIMIT 1;";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("$tenantId", tenantId);
        command.Parameters.AddWithValue("$executionId", executionId);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return ReadExecution(reader);
    }

    public async Task<IReadOnlyList<PipelineExecutionRecord>> ListExecutionsAsync(string tenantId, int limit, int offset, CancellationToken cancellationToken = default)
    {
        await EnsureTablesAsync(cancellationToken);

        var executions = new List<PipelineExecutionRecord>();
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT execution_id, tenant_id, email_id, workflow_name, state, started_at_utc, ended_at_utc, related_case_id, created_at_utc, updated_at_utc
FROM workflow_executions
WHERE tenant_id = $tenantId
ORDER BY started_at_utc DESC
LIMIT $limit OFFSET $offset;";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("$tenantId", tenantId);
        command.Parameters.AddWithValue("$limit", limit);
        command.Parameters.AddWithValue("$offset", offset);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            executions.Add(ReadExecution(reader));
        }

        return executions;
    }

    public async Task<IReadOnlyList<PipelineTransitionRecord>> GetTransitionsAsync(string tenantId, string executionId, CancellationToken cancellationToken = default)
    {
        await EnsureTablesAsync(cancellationToken);

        var transitions = new List<PipelineTransitionRecord>();
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT transition_id, execution_id, tenant_id, from_state, to_state, reason, actor_type, actor_id, notes, created_at_utc
FROM workflow_transitions
WHERE tenant_id = $tenantId AND execution_id = $executionId
ORDER BY created_at_utc ASC;";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("$tenantId", tenantId);
        command.Parameters.AddWithValue("$executionId", executionId);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            transitions.Add(ReadTransition(reader));
        }

        return transitions;
    }

    public async Task<PipelineReviewResult?> ApplyReviewAsync(
        string tenantId,
        string executionId,
        string decision,
        string reviewedByUserId,
        string? notes,
        CancellationToken cancellationToken = default)
    {
        await EnsureTablesAsync(cancellationToken);

        var current = await GetExecutionAsync(tenantId, executionId, cancellationToken);
        if (current is null)
        {
            return null;
        }

        var normalizedDecision = decision.Trim().ToUpperInvariant();
        var newState = normalizedDecision == "APPROVE" ? "APPROVED" : "REJECTED";
        var dossierId = normalizedDecision == "APPROVE" ? Guid.NewGuid().ToString("N") : null;
        var now = DateTime.UtcNow;

        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        using var transaction = connection.BeginTransaction();

        using (var update = connection.CreateCommand())
        {
            update.CommandText = @"
UPDATE workflow_executions
SET state = $state,
    ended_at_utc = CASE WHEN $newState IN ('APPROVED','REJECTED') THEN $now ELSE ended_at_utc END,
    related_case_id = $relatedCaseId,
    updated_at_utc = $now
WHERE tenant_id = $tenantId AND execution_id = $executionId;";
            update.Parameters.AddWithValue("$state", newState);
            update.Parameters.AddWithValue("$newState", newState);
            update.Parameters.AddWithValue("$now", now.ToString("O"));
            update.Parameters.AddWithValue("$relatedCaseId", (object?)dossierId ?? DBNull.Value);
            update.Parameters.AddWithValue("$tenantId", tenantId);
            update.Parameters.AddWithValue("$executionId", executionId);

            await update.ExecuteNonQueryAsync(cancellationToken);
        }

        await InsertTransitionAsync(connection, new PipelineTransitionRecord
        {
            TransitionId = Guid.NewGuid().ToString("N"),
            ExecutionId = executionId,
            TenantId = tenantId,
            FromState = current.State,
            ToState = newState,
            Reason = "human-review",
            ActorType = "human",
            ActorId = reviewedByUserId,
            Notes = notes,
            CreatedAtUtc = now,
        }, cancellationToken);

        transaction.Commit();

        return new PipelineReviewResult
        {
            ExecutionId = executionId,
            PreviousState = current.State,
            NewState = newState,
            DossierUpdated = dossierId is not null,
            DossierId = dossierId,
        };
    }

    private async Task EnsureTablesAsync(CancellationToken cancellationToken)
    {
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
CREATE TABLE IF NOT EXISTS workflow_executions (
  execution_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at_utc TEXT NOT NULL,
  ended_at_utc TEXT NULL,
  related_case_id TEXT NULL,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_tenant_state
  ON workflow_executions (tenant_id, state);

CREATE TABLE IF NOT EXISTS workflow_transitions (
  transition_id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  from_state TEXT NULL,
  to_state TEXT NOT NULL,
  reason TEXT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NULL,
  notes TEXT NULL,
  created_at_utc TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_exec
  ON workflow_transitions (tenant_id, execution_id, created_at_utc);";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertExecutionAsync(SqliteConnection connection, PipelineExecutionRecord execution, CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO workflow_executions (
  execution_id, tenant_id, email_id, workflow_name, state,
  started_at_utc, ended_at_utc, related_case_id, created_at_utc, updated_at_utc
) VALUES (
  $executionId, $tenantId, $emailId, $workflowName, $state,
  $startedAtUtc, $endedAtUtc, $relatedCaseId, $createdAtUtc, $updatedAtUtc
);";
        command.Parameters.AddWithValue("$executionId", execution.ExecutionId);
        command.Parameters.AddWithValue("$tenantId", execution.TenantId);
        command.Parameters.AddWithValue("$emailId", execution.EmailId);
        command.Parameters.AddWithValue("$workflowName", execution.WorkflowName);
        command.Parameters.AddWithValue("$state", execution.State);
        command.Parameters.AddWithValue("$startedAtUtc", execution.StartedAtUtc.ToString("O"));
        command.Parameters.AddWithValue("$endedAtUtc", DBNull.Value);
        command.Parameters.AddWithValue("$relatedCaseId", DBNull.Value);
        command.Parameters.AddWithValue("$createdAtUtc", execution.CreatedAtUtc.ToString("O"));
        command.Parameters.AddWithValue("$updatedAtUtc", execution.UpdatedAtUtc.ToString("O"));

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertTransitionAsync(SqliteConnection connection, PipelineTransitionRecord transition, CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = @"
INSERT INTO workflow_transitions (
  transition_id, execution_id, tenant_id, from_state, to_state,
  reason, actor_type, actor_id, notes, created_at_utc
) VALUES (
  $transitionId, $executionId, $tenantId, $fromState, $toState,
  $reason, $actorType, $actorId, $notes, $createdAtUtc
);";
        command.Parameters.AddWithValue("$transitionId", transition.TransitionId);
        command.Parameters.AddWithValue("$executionId", transition.ExecutionId);
        command.Parameters.AddWithValue("$tenantId", transition.TenantId);
        command.Parameters.AddWithValue("$fromState", (object?)transition.FromState ?? DBNull.Value);
        command.Parameters.AddWithValue("$toState", transition.ToState);
        command.Parameters.AddWithValue("$reason", (object?)transition.Reason ?? DBNull.Value);
        command.Parameters.AddWithValue("$actorType", transition.ActorType);
        command.Parameters.AddWithValue("$actorId", (object?)transition.ActorId ?? DBNull.Value);
        command.Parameters.AddWithValue("$notes", (object?)transition.Notes ?? DBNull.Value);
        command.Parameters.AddWithValue("$createdAtUtc", transition.CreatedAtUtc.ToString("O"));

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static PipelineExecutionRecord ReadExecution(SqliteDataReader reader)
    {
        return new PipelineExecutionRecord
        {
            ExecutionId = reader.GetString(0),
            TenantId = reader.GetString(1),
            EmailId = reader.GetString(2),
            WorkflowName = reader.GetString(3),
            State = reader.GetString(4),
            StartedAtUtc = DateTime.Parse(reader.GetString(5)),
            EndedAtUtc = reader.IsDBNull(6) ? null : DateTime.Parse(reader.GetString(6)),
            RelatedCaseId = reader.IsDBNull(7) ? null : reader.GetString(7),
            CreatedAtUtc = DateTime.Parse(reader.GetString(8)),
            UpdatedAtUtc = DateTime.Parse(reader.GetString(9)),
        };
    }

    private static PipelineTransitionRecord ReadTransition(SqliteDataReader reader)
    {
        return new PipelineTransitionRecord
        {
            TransitionId = reader.GetString(0),
            ExecutionId = reader.GetString(1),
            TenantId = reader.GetString(2),
            FromState = reader.IsDBNull(3) ? null : reader.GetString(3),
            ToState = reader.GetString(4),
            Reason = reader.IsDBNull(5) ? null : reader.GetString(5),
            ActorType = reader.GetString(6),
            ActorId = reader.IsDBNull(7) ? null : reader.GetString(7),
            Notes = reader.IsDBNull(8) ? null : reader.GetString(8),
            CreatedAtUtc = DateTime.Parse(reader.GetString(9)),
        };
    }
}

public class PipelineExecutionRecord
{
    public string ExecutionId { get; set; } = null!;
    public string TenantId { get; set; } = null!;
    public string EmailId { get; set; } = null!;
    public string WorkflowName { get; set; } = null!;
    public string State { get; set; } = null!;
    public DateTime StartedAtUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }
    public string? RelatedCaseId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

public class PipelineTransitionRecord
{
    public string TransitionId { get; set; } = null!;
    public string ExecutionId { get; set; } = null!;
    public string TenantId { get; set; } = null!;
    public string? FromState { get; set; }
    public string ToState { get; set; } = null!;
    public string? Reason { get; set; }
    public string ActorType { get; set; } = null!;
    public string? ActorId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PipelineReviewResult
{
    public string ExecutionId { get; set; } = null!;
    public string PreviousState { get; set; } = null!;
    public string NewState { get; set; } = null!;
    public bool DossierUpdated { get; set; }
    public string? DossierId { get; set; }
}
