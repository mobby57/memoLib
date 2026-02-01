-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formType" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" TEXT NOT NULL,
    "impactScore" INTEGER,
    "impactAreas" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalLevel" INTEGER NOT NULL DEFAULT 0,
    "aiAnalysis" TEXT,
    "metadata" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StrategicDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "proposedSolution" TEXT NOT NULL,
    "expectedImpact" TEXT,
    "risks" TEXT,
    "timeline" TEXT,
    "kpis" TEXT,
    "riskScore" INTEGER,
    "impactScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending-approval',
    "submitterId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectionNote" TEXT,
    "implementedAt" DATETIME,
    "implementedBy" TEXT,
    "implementStatus" TEXT,
    "kpiResults" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "mitigationPlan" TEXT,
    "responsiblePerson" TEXT,
    "targetDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "submitterId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "reviewDate" DATETIME,
    "lastReviewed" DATETIME,
    "reviewedBy" TEXT,
    "aiActionPlan" TEXT,
    "materialized" BOOLEAN NOT NULL DEFAULT false,
    "materializedAt" DATETIME,
    "actualImpact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApprovalTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "decision" TEXT,
    "comments" TEXT,
    "decidedAt" DATETIME,
    "decidedBy" TEXT,
    "dueDate" DATETIME,
    "reminded" BOOLEAN NOT NULL DEFAULT false,
    "remindedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovalTask_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" TEXT,
    "targetEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "actionUrl" TEXT,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InteractiveNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "content" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "mustRespond" BOOLEAN NOT NULL DEFAULT false,
    "requiresForm" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT,
    "assignedRole" TEXT,
    "respondedAt" DATETIME,
    "respondedBy" TEXT,
    "responseData" TEXT,
    "expiresAt" DATETIME,
    "workflowId" TEXT,
    "triggeredBy" TEXT,
    "triggerData" TEXT,
    "aiAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "formConfig" TEXT,
    "metadata" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" DATETIME,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationAction_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "InteractiveNotification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowTrigger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "triggerType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "eventData" TEXT NOT NULL,
    "aiAnalysis" TEXT,
    "notificationId" TEXT,
    "workflowStatus" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "processingErrors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "AdaptiveFormTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "formConfig" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiPrompts" TEXT,
    "triggerTypes" TEXT NOT NULL,
    "autoActions" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowType" TEXT NOT NULL,
    "triggerId" TEXT,
    "contextData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "notificationId" TEXT,
    "formId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "outputs" TEXT,
    "errors" TEXT,
    "aiAnalysisTime" INTEGER,
    "formGenerationTime" INTEGER
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "destinataireId" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "luLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FormSubmission_formType_idx" ON "FormSubmission"("formType");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_submitterId_idx" ON "FormSubmission"("submitterId");

-- CreateIndex
CREATE INDEX "FormSubmission_impactScore_idx" ON "FormSubmission"("impactScore");

-- CreateIndex
CREATE INDEX "FormSubmission_submittedAt_idx" ON "FormSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "StrategicDecision_status_idx" ON "StrategicDecision"("status");

-- CreateIndex
CREATE INDEX "StrategicDecision_submitterId_idx" ON "StrategicDecision"("submitterId");

-- CreateIndex
CREATE INDEX "StrategicDecision_riskScore_idx" ON "StrategicDecision"("riskScore");

-- CreateIndex
CREATE INDEX "StrategicDecision_impactScore_idx" ON "StrategicDecision"("impactScore");

-- CreateIndex
CREATE INDEX "RiskAssessment_category_idx" ON "RiskAssessment"("category");

-- CreateIndex
CREATE INDEX "RiskAssessment_priorityLevel_idx" ON "RiskAssessment"("priorityLevel");

-- CreateIndex
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- CreateIndex
CREATE INDEX "RiskAssessment_riskScore_idx" ON "RiskAssessment"("riskScore");

-- CreateIndex
CREATE INDEX "RiskAssessment_submitterId_idx" ON "RiskAssessment"("submitterId");

-- CreateIndex
CREATE INDEX "RiskAssessment_targetDate_idx" ON "RiskAssessment"("targetDate");

-- CreateIndex
CREATE INDEX "ApprovalTask_submissionId_idx" ON "ApprovalTask"("submissionId");

-- CreateIndex
CREATE INDEX "ApprovalTask_status_idx" ON "ApprovalTask"("status");

-- CreateIndex
CREATE INDEX "ApprovalTask_approverRole_idx" ON "ApprovalTask"("approverRole");

-- CreateIndex
CREATE INDEX "ApprovalTask_level_idx" ON "ApprovalTask"("level");

-- CreateIndex
CREATE INDEX "ApprovalTask_dueDate_idx" ON "ApprovalTask"("dueDate");

-- CreateIndex
CREATE INDEX "SystemAlert_tenantId_idx" ON "SystemAlert"("tenantId");

-- CreateIndex
CREATE INDEX "SystemAlert_type_idx" ON "SystemAlert"("type");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_status_idx" ON "SystemAlert"("status");

-- CreateIndex
CREATE INDEX "InteractiveNotification_status_idx" ON "InteractiveNotification"("status");

-- CreateIndex
CREATE INDEX "InteractiveNotification_category_idx" ON "InteractiveNotification"("category");

-- CreateIndex
CREATE INDEX "InteractiveNotification_priority_idx" ON "InteractiveNotification"("priority");

-- CreateIndex
CREATE INDEX "InteractiveNotification_assignedTo_idx" ON "InteractiveNotification"("assignedTo");

-- CreateIndex
CREATE INDEX "InteractiveNotification_mustRespond_idx" ON "InteractiveNotification"("mustRespond");

-- CreateIndex
CREATE INDEX "InteractiveNotification_expiresAt_idx" ON "InteractiveNotification"("expiresAt");

-- CreateIndex
CREATE INDEX "NotificationAction_notificationId_idx" ON "NotificationAction"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationAction_type_idx" ON "NotificationAction"("type");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_triggerType_idx" ON "WorkflowTrigger"("triggerType");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_workflowStatus_idx" ON "WorkflowTrigger"("workflowStatus");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_entityType_entityId_idx" ON "WorkflowTrigger"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_createdAt_idx" ON "WorkflowTrigger"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdaptiveFormTemplate_name_key" ON "AdaptiveFormTemplate"("name");

-- CreateIndex
CREATE INDEX "AdaptiveFormTemplate_category_idx" ON "AdaptiveFormTemplate"("category");

-- CreateIndex
CREATE INDEX "AdaptiveFormTemplate_isActive_idx" ON "AdaptiveFormTemplate"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowType_idx" ON "WorkflowExecution"("workflowType");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_startedAt_idx" ON "WorkflowExecution"("startedAt");

-- CreateIndex
CREATE INDEX "Message_expediteurId_idx" ON "Message"("expediteurId");

-- CreateIndex
CREATE INDEX "Message_destinataireId_idx" ON "Message"("destinataireId");

-- CreateIndex
CREATE INDEX "Message_lu_idx" ON "Message"("lu");
