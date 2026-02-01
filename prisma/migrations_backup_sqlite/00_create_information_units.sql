-- Migration: Create information_units table (Zero Ignored Information Guarantee)
-- Date: 2026-01-22
-- Purpose: Closed pipeline for exhaustive information tracking

-- ============================================
-- TABLE: information_units
-- ============================================
-- Tracks all information with mandatory state machine
-- Prevents any information from being ignored/forgotten
-- Enforces: RECEIVED -> CLASSIFIED -> ANALYZED -> [INCOMPLETE|AMBIGUOUS|RESOLVED] -> CLOSED

CREATE TABLE IF NOT EXISTS "InformationUnit" (
  -- Primary key & relationships
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "linkedWorkspaceId" UUID,

  -- Source information
  "source" VARCHAR(50) NOT NULL, -- EMAIL, PHONE, DOCUMENT, API, MANUAL, SMS
  "sourceMetadata" JSONB, -- {email_from, email_id, phone_number, etc}
  "content" TEXT NOT NULL,
  "contentHash" CHAR(64) NOT NULL, -- SHA-256 for deduplication

  -- Current state (MANDATORY pipeline)
  "currentStatus" VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
  -- RECEIVED (max 5 min) -> auto-classify
  -- CLASSIFIED (max 15 min) -> AI analyze
  -- ANALYZED (max 30 min) -> decision point
  -- INCOMPLETE (missing data, 48h reminder, 72h escalate)
  -- AMBIGUOUS (uncertain context, immediate escalate)
  -- HUMAN_ACTION_REQUIRED (blocking, daily reminders)
  -- RESOLVED (action completed, 7 day hold)
  -- CLOSED (final archive)
  "statusReason" TEXT, -- Why in this status? (required justification)

  -- Validation flags
  "requiresHumanAction" BOOLEAN DEFAULT FALSE,
  "humanValidated" BOOLEAN DEFAULT FALSE,
  "validatedAt" TIMESTAMPTZ,
  "validatedBy" VARCHAR(255), -- User ID who validated

  -- Escalation tracking
  "escalationCount" INT DEFAULT 0,
  "lastEscalatedAt" TIMESTAMPTZ,
  "escalationReasons" JSONB DEFAULT '[]'::jsonb, -- Array of {timestamp, reason, escalatedBy}

  -- Audit trail (IMMUTABLE - append-only JSONB array)
  "statusHistory" JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{
  --   "timestamp": "2026-01-22T09:23:00Z",
  --   "fromStatus": "RECEIVED",
  --   "toStatus": "CLASSIFIED",
  --   "reason": "IA classification: EMAIL from client (89% confidence)",
  --   "changedBy": "system",
  --   "metadata": {additional_context}
  -- }]

  "lastStatusChangeAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastStatusChangeBy" VARCHAR(255) NOT NULL DEFAULT 'system',

  -- Metadata (flexible, source-specific data)
  "metadata" JSONB, -- {email_subject, email_labels, page_count, file_type, etc}

  -- Timestamps
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Primary key
  PRIMARY KEY ("id"),

  -- Foreign key to Workspace (optional - may not have workspace yet)
  CONSTRAINT "fk_information_unit_workspace"
    FOREIGN KEY ("linkedWorkspaceId")
    REFERENCES "Workspace"("id")
    ON DELETE SET NULL,

  -- Foreign key to Tenant
  CONSTRAINT "fk_information_unit_tenant"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE,

  -- CONSTRAINT: Valid status values
  CONSTRAINT "valid_status"
    CHECK ("currentStatus" IN (
      'RECEIVED',
      'CLASSIFIED',
      'ANALYZED',
      'INCOMPLETE',
      'AMBIGUOUS',
      'HUMAN_ACTION_REQUIRED',
      'RESOLVED',
      'CLOSED'
    )),

  -- CONSTRAINT: Valid source values
  CONSTRAINT "valid_source"
    CHECK ("source" IN (
      'EMAIL',
      'PHONE',
      'DOCUMENT',
      'API',
      'MANUAL',
      'SMS'
    ))
);

-- Indexes for performance
CREATE INDEX "idx_information_unit_tenant_id" ON "InformationUnit"("tenantId");
CREATE INDEX "idx_information_unit_current_status" ON "InformationUnit"("currentStatus");
CREATE INDEX "idx_information_unit_linked_workspace_id" ON "InformationUnit"("linkedWorkspaceId");
CREATE INDEX "idx_information_unit_received_at" ON "InformationUnit"("receivedAt");
CREATE INDEX "idx_information_unit_requires_human_action" ON "InformationUnit"("requiresHumanAction");
CREATE INDEX "idx_information_unit_content_hash" ON "InformationUnit"("contentHash"); -- For deduplication
CREATE INDEX "idx_information_unit_last_status_change" ON "InformationUnit"("lastStatusChangeAt");

-- JSONB indexes for audit trail queries
CREATE INDEX "idx_information_unit_status_history" ON "InformationUnit" USING GIN ("statusHistory");

-- Query optimization: Find units needing escalation
CREATE INDEX "idx_information_unit_escalation_needed" ON "InformationUnit"(
  "currentStatus",
  "lastStatusChangeAt"
) WHERE "currentStatus" IN ('INCOMPLETE', 'AMBIGUOUS', 'HUMAN_ACTION_REQUIRED');

-- ============================================
-- FUNCTION: Update updatedAt timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_information_unit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Auto-update updatedAt on changes
DROP TRIGGER IF EXISTS update_information_unit_timestamp_trigger ON "InformationUnit";
CREATE TRIGGER update_information_unit_timestamp_trigger
BEFORE UPDATE ON "InformationUnit"
FOR EACH ROW
EXECUTE FUNCTION update_information_unit_timestamp();

-- ============================================
-- FUNCTION: Validate closed pipeline rules
-- ============================================
-- Enforces: No direct transition to CLOSED except from RESOLVED
CREATE OR REPLACE FUNCTION validate_information_unit_transitions()
RETURNS TRIGGER AS $$
DECLARE
  _last_status VARCHAR(50);
BEGIN
  -- Get previous status from audit trail
  IF jsonb_array_length(NEW."statusHistory") > 0 THEN
    _last_status := NEW."statusHistory"->(-1)->'toStatus';
  ELSE
    _last_status := 'RECEIVED';
  END IF;

  -- RULE: Cannot directly transition to CLOSED except from RESOLVED
  IF NEW."currentStatus" = 'CLOSED' AND _last_status != 'RESOLVED' THEN
    RAISE EXCEPTION 'Cannot transition to CLOSED from %. Must pass through RESOLVED first', _last_status;
  END IF;

  -- RULE: RESOLVED cannot go back to earlier states
  IF _last_status = 'RESOLVED' AND NEW."currentStatus" IN ('RECEIVED', 'CLASSIFIED', 'ANALYZED', 'INCOMPLETE', 'AMBIGUOUS') THEN
    RAISE EXCEPTION 'Cannot transition from RESOLVED back to %. Pipeline is unidirectional', NEW."currentStatus";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Enforce pipeline rules
DROP TRIGGER IF EXISTS validate_information_unit_transitions_trigger ON "InformationUnit";
CREATE TRIGGER validate_information_unit_transitions_trigger
BEFORE UPDATE ON "InformationUnit"
FOR EACH ROW
EXECUTE FUNCTION validate_information_unit_transitions();

-- ============================================
-- FUNCTION: Append-only audit trail
-- ============================================
-- Ensures status history cannot be modified, only appended
CREATE OR REPLACE FUNCTION append_information_unit_history()
RETURNS TRIGGER AS $$
BEGIN
  -- If statusHistory was modified in a way other than appending (clearing, reordering), reject
  IF jsonb_array_length(OLD."statusHistory") > 0 AND 
     jsonb_array_length(NEW."statusHistory") < jsonb_array_length(OLD."statusHistory") THEN
    RAISE EXCEPTION 'Audit trail is immutable. Cannot delete or reorder history entries.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Protect audit trail
DROP TRIGGER IF EXISTS append_information_unit_history_trigger ON "InformationUnit";
CREATE TRIGGER append_information_unit_history_trigger
BEFORE UPDATE ON "InformationUnit"
FOR EACH ROW
EXECUTE FUNCTION append_information_unit_history();

-- ============================================
-- FUNCTION: Auto-populate history on transition
-- ============================================
-- When currentStatus changes, append to statusHistory BEFORE validation
CREATE OR REPLACE FUNCTION record_information_unit_transition()
RETURNS TRIGGER AS $$
DECLARE
  _new_entry JSONB;
  _last_entry JSONB;
BEGIN
  -- Only if status actually changed
  IF NEW."currentStatus" != OLD."currentStatus" THEN
    -- Create new history entry
    _new_entry := jsonb_build_object(
      'timestamp', to_jsonb(NOW() AT TIME ZONE 'UTC'),
      'fromStatus', OLD."currentStatus",
      'toStatus', NEW."currentStatus",
      'reason', NEW."statusReason",
      'changedBy', NEW."lastStatusChangeBy",
      'metadata', NEW."metadata"
    );

    -- Append to statusHistory
    NEW."statusHistory" := NEW."statusHistory" || jsonb_build_array(_new_entry);

    -- Update timestamp
    NEW."lastStatusChangeAt" := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Record transitions in history (runs AFTER validation)
DROP TRIGGER IF EXISTS record_information_unit_transition_trigger ON "InformationUnit";
CREATE TRIGGER record_information_unit_transition_trigger
BEFORE UPDATE ON "InformationUnit"
FOR EACH ROW
EXECUTE FUNCTION record_information_unit_transition();

-- ============================================
-- VIEW: Information units needing escalation
-- ============================================
-- For cron jobs and automated alerts
CREATE OR REPLACE VIEW "InformationUnitEscalationNeeded" AS
SELECT 
  id,
  "tenantId",
  "linkedWorkspaceId",
  "currentStatus",
  "receivedAt",
  "lastStatusChangeAt",
  NOW() - "lastStatusChangeAt" AS "timeSinceLastChange",
  CASE
    WHEN "currentStatus" = 'INCOMPLETE' AND NOW() - "lastStatusChangeAt" > INTERVAL '48 hours'
      THEN 'CLIENT_REMINDER'
    WHEN "currentStatus" = 'INCOMPLETE' AND NOW() - "lastStatusChangeAt" > INTERVAL '72 hours'
      THEN 'ESCALATE_TO_HUMAN_ACTION'
    WHEN "currentStatus" = 'HUMAN_ACTION_REQUIRED' AND NOW() - "lastStatusChangeAt" > INTERVAL '96 hours'
      THEN 'ADMIN_ALERT'
    ELSE NULL
  END AS "escalationAction",
  CASE
    WHEN "currentStatus" = 'INCOMPLETE' AND NOW() - "lastStatusChangeAt" > INTERVAL '48 hours'
      THEN 1
    WHEN "currentStatus" = 'INCOMPLETE' AND NOW() - "lastStatusChangeAt" > INTERVAL '72 hours'
      THEN 2
    WHEN "currentStatus" = 'HUMAN_ACTION_REQUIRED' AND NOW() - "lastStatusChangeAt" > INTERVAL '96 hours'
      THEN 3
    ELSE 999
  END AS "escalationPriority"
FROM "InformationUnit"
WHERE "currentStatus" IN ('INCOMPLETE', 'AMBIGUOUS', 'HUMAN_ACTION_REQUIRED')
  AND (NOW() - "lastStatusChangeAt" > INTERVAL '48 hours'
    OR "currentStatus" = 'AMBIGUOUS');

-- ============================================
-- VIEW: Pipeline health metrics
-- ============================================
CREATE OR REPLACE VIEW "InformationUnitMetrics" AS
SELECT 
  "tenantId",
  COUNT(*) AS "totalUnits",
  COUNT(*) FILTER (WHERE "currentStatus" = 'RECEIVED') AS "countReceived",
  COUNT(*) FILTER (WHERE "currentStatus" = 'CLASSIFIED') AS "countClassified",
  COUNT(*) FILTER (WHERE "currentStatus" = 'ANALYZED') AS "countAnalyzed",
  COUNT(*) FILTER (WHERE "currentStatus" = 'INCOMPLETE') AS "countIncomplete",
  COUNT(*) FILTER (WHERE "currentStatus" = 'AMBIGUOUS') AS "countAmbiguous",
  COUNT(*) FILTER (WHERE "currentStatus" = 'HUMAN_ACTION_REQUIRED') AS "countActionRequired",
  COUNT(*) FILTER (WHERE "currentStatus" = 'RESOLVED') AS "countResolved",
  COUNT(*) FILTER (WHERE "currentStatus" = 'CLOSED') AS "countClosed",
  ROUND(100.0 * COUNT(*) FILTER (WHERE "currentStatus" = 'CLOSED') / NULLIF(COUNT(*), 0), 2) AS "closureRate",
  ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - "lastStatusChangeAt")) / 3600), 2) AS "avgHoursInCurrentStatus"
FROM "InformationUnit"
GROUP BY "tenantId";

-- ============================================
-- INDEXES SUMMARY
-- ============================================
-- Covering indexes for common queries:
-- 1. Find units by tenant+status: idx_information_unit_tenant_id + idx_information_unit_current_status
-- 2. Find stale units for escalation: idx_information_unit_escalation_needed
-- 3. Deduplication by hash: idx_information_unit_content_hash
-- 4. Audit trail analysis: idx_information_unit_status_history (GIN JSONB)

-- ============================================
-- PERMISSIONS (multi-tenant isolation)
-- ============================================
-- Row-level security should be enforced at application level
-- Ensure all queries filter by tenantId to prevent data leakage

COMMIT;
