-- CreateEnum
CREATE TYPE "FilterRuleOperator" AS ENUM ('EQUALS', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'REGEX', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN');

-- CreateEnum
CREATE TYPE "FilterRuleAction" AS ENUM ('ASSIGN_DOSSIER', 'ASSIGN_CLIENT', 'SET_CATEGORY', 'SET_URGENCY', 'SET_TAGS', 'MARK_STARRED', 'ARCHIVE', 'NOTIFY_USER', 'TRIGGER_WORKFLOW');

-- CreateTable
CREATE TABLE "filter_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "lastMatchedAt" TIMESTAMP(3),
    "lastMatchedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "filter_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "filter_rules_tenantId_enabled_priority_idx" ON "filter_rules"("tenantId", "enabled", "priority");

-- CreateIndex
CREATE INDEX "filter_rules_dossierId_idx" ON "filter_rules"("dossierId");

-- CreateIndex
CREATE INDEX "filter_rules_clientId_idx" ON "filter_rules"("clientId");

-- AddForeignKey
ALTER TABLE "filter_rules" ADD CONSTRAINT "filter_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filter_rules" ADD CONSTRAINT "filter_rules_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filter_rules" ADD CONSTRAINT "filter_rules_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
