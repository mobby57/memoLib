-- Colonnes de chaînage/preuve pour AIDecision (idempotent).
ALTER TABLE "AIDecision" ADD COLUMN IF NOT EXISTS "blockchainHash" TEXT;
ALTER TABLE "AIDecision" ADD COLUMN IF NOT EXISTS "exportedAt" TIMESTAMP(3);
