-- Migration: add deadline acknowledge, suspend, escalate fields + SUSPENDED status
-- Plan: PLAN_COMPLET.md §5.4 Logique de relance + §5.5 Logique d'escalade

ALTER TABLE "LegalDeadline"
  ADD COLUMN IF NOT EXISTS "acknowledgedBy"  TEXT,
  ADD COLUMN IF NOT EXISTS "acknowledgedAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "suspendedAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspendedBy"     TEXT,
  ADD COLUMN IF NOT EXISTS "escalatedAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "escalatedTo"     TEXT,
  ADD COLUMN IF NOT EXISTS "alertSmsSent"    BOOLEAN NOT NULL DEFAULT false;

-- Add SUSPENDED to DeadlineStatus enum
ALTER TYPE "DeadlineStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Index for acknowledged queries
CREATE INDEX IF NOT EXISTS "LegalDeadline_acknowledgedBy_idx" ON "LegalDeadline"("acknowledgedBy");
