-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "profession" TEXT,
ADD COLUMN     "situationFamiliale" TEXT;

-- AlterTable
ALTER TABLE "Draft" ADD COLUMN     "procedureId" TEXT;

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "needsResponse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workspaceId" TEXT;

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "procedureType" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "urgencyLevel" TEXT NOT NULL DEFAULT 'moyen',
    "notificationDate" TIMESTAMP(3),
    "deadlineDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "globalPriority" TEXT,
    "primaryLawyerId" TEXT,
    "teamMemberIds" JSONB,
    "preferredChannel" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalProcedures" INTEGER NOT NULL DEFAULT 0,
    "activeProcedures" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "urgencyLevel" TEXT NOT NULL DEFAULT 'moyen',
    "notificationDate" TIMESTAMP(3),
    "deadlineDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "assignedTo" TEXT,
    "outcome" TEXT,
    "outcomeNotes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureChecklistItem" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceChecklistItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'pieces',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "documentId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receivedVia" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureDeadline" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateEcheance" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'a_venir',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "procedureId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "documentType" TEXT,
    "description" TEXT,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "tags" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMessage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'system',
    "senderId" TEXT,
    "senderName" TEXT,
    "senderType" TEXT,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "visibility" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorType" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAlert" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" TEXT,
    "assigneeId" TEXT,
    "category" TEXT,
    "metadata" JSONB,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceReasoning" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "emailId" TEXT,
    "ownerUserId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceRawEncrypted" TEXT NOT NULL,
    "sourceMetadataEncrypted" TEXT,
    "procedureType" TEXT,
    "currentState" TEXT NOT NULL DEFAULT 'RECEIVED',
    "stateChangedAt" TIMESTAMP(3),
    "stateChangedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "validationNote" TEXT,
    "reasoningQuality" DOUBLE PRECISION,
    "uncertaintyLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "confidenceScore" DOUBLE PRECISION,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceReasoning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fact" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "extractedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextHypothesis" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT,
    "certaintyLevel" TEXT NOT NULL DEFAULT 'POSSIBLE',
    "identifiedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextHypothesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "deadline" TIMESTAMP(3),
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "legalRef" TEXT,
    "deducedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissingElement" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "why" TEXT,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "identifiedBy" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissingElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "irreversible" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER NOT NULL,
    "evaluatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedAction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "result" TEXT,
    "proposedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningTrace" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "metadata" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningTransition" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "metadata" TEXT,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "stateBefore" TEXT,
    "stateAfter" TEXT,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workspace_tenantId_status_idx" ON "Workspace"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Workspace_tenantId_createdAt_idx" ON "Workspace"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Workspace_clientId_idx" ON "Workspace"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_id_tenantId_key" ON "Workspace"("id", "tenantId");

-- CreateIndex
CREATE INDEX "Procedure_workspaceId_status_idx" ON "Procedure"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Procedure_workspaceId_createdAt_idx" ON "Procedure"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcedureChecklistItem_procedureId_order_idx" ON "ProcedureChecklistItem"("procedureId", "order");

-- CreateIndex
CREATE INDEX "WorkspaceChecklistItem_workspaceId_status_idx" ON "WorkspaceChecklistItem"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceChecklistItem_workspaceId_order_idx" ON "WorkspaceChecklistItem"("workspaceId", "order");

-- CreateIndex
CREATE INDEX "ProcedureDeadline_procedureId_completed_idx" ON "ProcedureDeadline"("procedureId", "completed");

-- CreateIndex
CREATE INDEX "ProcedureDeadline_date_idx" ON "ProcedureDeadline"("date");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_workspaceId_uploadedAt_idx" ON "WorkspaceDocument"("workspaceId", "uploadedAt");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_procedureId_idx" ON "WorkspaceDocument"("procedureId");

-- CreateIndex
CREATE INDEX "WorkspaceMessage_workspaceId_createdAt_idx" ON "WorkspaceMessage"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_workspaceId_createdAt_idx" ON "TimelineEvent"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceNote_workspaceId_createdAt_idx" ON "WorkspaceNote"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceAlert_workspaceId_resolved_idx" ON "WorkspaceAlert"("workspaceId", "resolved");

-- CreateIndex
CREATE INDEX "WorkspaceAlert_createdAt_idx" ON "WorkspaceAlert"("createdAt");

-- CreateIndex
CREATE INDEX "Task_workspaceId_status_idx" ON "Task"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_tenantId_currentState_idx" ON "WorkspaceReasoning"("tenantId", "currentState");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_tenantId_clientId_idx" ON "WorkspaceReasoning"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_tenantId_dossierId_idx" ON "WorkspaceReasoning"("tenantId", "dossierId");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_tenantId_createdAt_idx" ON "WorkspaceReasoning"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_emailId_idx" ON "WorkspaceReasoning"("emailId");

-- CreateIndex
CREATE INDEX "Fact_workspaceId_createdAt_idx" ON "Fact"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ContextHypothesis_workspaceId_createdAt_idx" ON "ContextHypothesis"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Obligation_workspaceId_contextId_idx" ON "Obligation"("workspaceId", "contextId");

-- CreateIndex
CREATE INDEX "Obligation_workspaceId_deadline_idx" ON "Obligation"("workspaceId", "deadline");

-- CreateIndex
CREATE INDEX "MissingElement_workspaceId_resolved_idx" ON "MissingElement"("workspaceId", "resolved");

-- CreateIndex
CREATE INDEX "Risk_workspaceId_riskScore_idx" ON "Risk"("workspaceId", "riskScore");

-- CreateIndex
CREATE INDEX "ProposedAction_workspaceId_priority_idx" ON "ProposedAction"("workspaceId", "priority");

-- CreateIndex
CREATE INDEX "ReasoningTrace_workspaceId_createdAt_idx" ON "ReasoningTrace"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReasoningTransition_workspaceId_createdAt_idx" ON "ReasoningTransition"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Draft_procedureId_idx" ON "Draft"("procedureId");

-- CreateIndex
CREATE INDEX "Email_tenantId_workspaceId_receivedDate_idx" ON "Email"("tenantId", "workspaceId", "receivedDate");

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureChecklistItem" ADD CONSTRAINT "ProcedureChecklistItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceChecklistItem" ADD CONSTRAINT "WorkspaceChecklistItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureDeadline" ADD CONSTRAINT "ProcedureDeadline_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMessage" ADD CONSTRAINT "WorkspaceMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceNote" ADD CONSTRAINT "WorkspaceNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAlert" ADD CONSTRAINT "WorkspaceAlert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceReasoning" ADD CONSTRAINT "WorkspaceReasoning_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceReasoning" ADD CONSTRAINT "WorkspaceReasoning_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceReasoning" ADD CONSTRAINT "WorkspaceReasoning_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceReasoning" ADD CONSTRAINT "WorkspaceReasoning_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceReasoning" ADD CONSTRAINT "WorkspaceReasoning_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fact" ADD CONSTRAINT "Fact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextHypothesis" ADD CONSTRAINT "ContextHypothesis_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ContextHypothesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingElement" ADD CONSTRAINT "MissingElement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningTrace" ADD CONSTRAINT "ReasoningTrace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningTransition" ADD CONSTRAINT "ReasoningTransition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning"("id") ON DELETE CASCADE ON UPDATE CASCADE;
