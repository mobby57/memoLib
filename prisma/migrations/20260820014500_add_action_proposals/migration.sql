-- CreateEnum
CREATE TYPE "ActionProposalType" AS ENUM (
    'REVIEW_EMAIL',
    'CREATE_DOSSIER',
    'CREATE_LEGAL_DEADLINE',
    'REQUEST_DOCUMENTS',
    'SCHEDULE_APPOINTMENT'
);

-- CreateEnum
CREATE TYPE "ActionProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActionProposalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActionProposalRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "ActionProposal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "emailId" TEXT,
    "dossierId" TEXT,
    "type" "ActionProposalType" NOT NULL,
    "status" "ActionProposalStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ActionProposalPriority" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "ActionProposalRiskLevel" NOT NULL DEFAULT 'LOW',
    "rationale" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "decisionReason" TEXT,
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "executionResult" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActionProposal_tenantId_idempotencyKey_key"
ON "ActionProposal"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ActionProposal_tenantId_status_priority_idx"
ON "ActionProposal"("tenantId", "status", "priority");

-- CreateIndex
CREATE INDEX "ActionProposal_dossierId_status_idx"
ON "ActionProposal"("dossierId", "status");

-- CreateIndex
CREATE INDEX "ActionProposal_emailId_idx"
ON "ActionProposal"("emailId");

-- AddForeignKey
ALTER TABLE "ActionProposal" ADD CONSTRAINT "ActionProposal_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionProposal" ADD CONSTRAINT "ActionProposal_emailId_fkey"
FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionProposal" ADD CONSTRAINT "ActionProposal_dossierId_fkey"
FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
