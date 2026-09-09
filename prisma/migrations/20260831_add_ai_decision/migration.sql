-- CreateTable
CREATE TABLE IF NOT EXISTS "AIDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIDecision_tenantId_idx" ON "AIDecision"("tenantId");
CREATE INDEX IF NOT EXISTS "AIDecision_entityId_idx" ON "AIDecision"("entityId");
CREATE INDEX IF NOT EXISTS "AIDecision_createdAt_idx" ON "AIDecision"("createdAt");
