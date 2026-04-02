-- CreateTable
CREATE TABLE "WorkspaceReasoning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "currentState" TEXT NOT NULL DEFAULT 'RECEIVED',
    "stateChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stateChangedBy" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceRaw" TEXT NOT NULL,
    "sourceMetadata" TEXT,
    "procedureType" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "clientId" TEXT,
    "dossierId" TEXT,
    "emailId" TEXT,
    "reasoningQuality" REAL,
    "uncertaintyLevel" REAL NOT NULL DEFAULT 1.0,
    "confidenceScore" REAL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "validationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "WorkspaceReasoning_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceReasoning_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceReasoning_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceReasoning_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "extractedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContextHypothesis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT,
    "certaintyLevel" TEXT NOT NULL DEFAULT 'POSSIBLE',
    "identifiedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContextHypothesis_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "deadline" DATETIME,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "legalRef" TEXT,
    "deducedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Obligation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Obligation_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ContextHypothesis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissingElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolution" TEXT,
    "identifiedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MissingElement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "irreversible" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER NOT NULL,
    "evaluatedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Risk_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposedAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedBy" TEXT,
    "executedAt" DATETIME,
    "result" TEXT,
    "proposedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProposedAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReasoningTrace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "metadata" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReasoningTrace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReasoningTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "metadata" TEXT,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "stateBefore" TEXT,
    "stateAfter" TEXT,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReasoningTransition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "WorkspaceReasoning" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "trialEnd" DATETIME,
    "canceledAt" DATETIME,
    "endedAt" DATETIME,
    "pricePerMonth" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "voidedAt" DATETIME,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "vatNumber" TEXT,
    "lineItems" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "metadata" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsageRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TenantUsageMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "workspacesCreated" INTEGER NOT NULL DEFAULT 0,
    "workspacesClosed" INTEGER NOT NULL DEFAULT 0,
    "workspacesActiveEOM" INTEGER NOT NULL DEFAULT 0,
    "dossiersCreated" INTEGER NOT NULL DEFAULT 0,
    "clientsCreated" INTEGER NOT NULL DEFAULT 0,
    "usersActive" INTEGER NOT NULL DEFAULT 0,
    "storageUsedGb" REAL NOT NULL DEFAULT 0,
    "aiCallsTotal" INTEGER NOT NULL DEFAULT 0,
    "aiCallsFactExtraction" INTEGER NOT NULL DEFAULT 0,
    "aiCallsContextId" INTEGER NOT NULL DEFAULT 0,
    "aiCallsRiskEval" INTEGER NOT NULL DEFAULT 0,
    "aiCallsActionProposal" INTEGER NOT NULL DEFAULT 0,
    "avgWorkspaceCompletionTime" REAL,
    "uncertaintyReductionAvg" REAL,
    "quotaWarnings" INTEGER NOT NULL DEFAULT 0,
    "quotaExceeded" INTEGER NOT NULL DEFAULT 0,
    "aiCostEur" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TenantUsageMetrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotaEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "quotaType" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL,
    "limitValue" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "actionTaken" TEXT,
    "metadata" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuotaEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "userId" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "hash" TEXT NOT NULL,
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "dataCategories" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLogEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" DATETIME,
    "revokedAt" DATETIME,
    "policyVersion" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConsentRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestDetails" TEXT NOT NULL,
    "response" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "respondedAt" DATETIME,
    "assignedTo" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DataSubjectRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataSubjectRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" REAL NOT NULL,
    "priceYearly" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "maxWorkspaces" INTEGER NOT NULL DEFAULT 1,
    "maxDossiers" INTEGER NOT NULL DEFAULT 100,
    "maxClients" INTEGER NOT NULL DEFAULT 20,
    "maxStorageGb" INTEGER NOT NULL DEFAULT 5,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "aiAutonomyLevel" INTEGER NOT NULL DEFAULT 1,
    "humanValidation" BOOLEAN NOT NULL DEFAULT true,
    "advancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "externalAiAccess" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "customBranding" BOOLEAN NOT NULL DEFAULT false,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("advancedAnalytics", "aiAutonomyLevel", "apiAccess", "createdAt", "currency", "customBranding", "description", "displayName", "externalAiAccess", "humanValidation", "id", "isActive", "maxClients", "maxDossiers", "maxStorageGb", "maxUsers", "name", "priceMonthly", "priceYearly", "prioritySupport", "updatedAt") SELECT "advancedAnalytics", "aiAutonomyLevel", "apiAccess", "createdAt", "currency", "customBranding", "description", "displayName", "externalAiAccess", "humanValidation", "id", "isActive", "maxClients", "maxDossiers", "maxStorageGb", "maxUsers", "name", "priceMonthly", "priceYearly", "prioritySupport", "updatedAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "domain" TEXT,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trialEndsAt" DATETIME,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "vatNumber" TEXT,
    "currentWorkspaces" INTEGER NOT NULL DEFAULT 0,
    "currentDossiers" INTEGER NOT NULL DEFAULT 0,
    "currentClients" INTEGER NOT NULL DEFAULT 0,
    "currentStorageGb" REAL NOT NULL DEFAULT 0,
    "currentUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tenant" ("billingAddress", "billingEmail", "createdAt", "currentClients", "currentDossiers", "currentStorageGb", "currentUsers", "domain", "id", "name", "planId", "status", "subdomain", "trialEndsAt", "updatedAt", "vatNumber") SELECT "billingAddress", "billingEmail", "createdAt", "currentClients", "currentDossiers", "currentStorageGb", "currentUsers", "domain", "id", "name", "planId", "status", "subdomain", "trialEndsAt", "updatedAt", "vatNumber" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");
CREATE INDEX "Tenant_planId_idx" ON "Tenant"("planId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_tenantId_currentState_idx" ON "WorkspaceReasoning"("tenantId", "currentState");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_tenantId_uncertaintyLevel_idx" ON "WorkspaceReasoning"("tenantId", "uncertaintyLevel");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_currentState_createdAt_idx" ON "WorkspaceReasoning"("currentState", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_ownerUserId_idx" ON "WorkspaceReasoning"("ownerUserId");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_clientId_idx" ON "WorkspaceReasoning"("clientId");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_dossierId_idx" ON "WorkspaceReasoning"("dossierId");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_emailId_idx" ON "WorkspaceReasoning"("emailId");

-- CreateIndex
CREATE INDEX "WorkspaceReasoning_locked_idx" ON "WorkspaceReasoning"("locked");

-- CreateIndex
CREATE INDEX "Fact_workspaceId_idx" ON "Fact"("workspaceId");

-- CreateIndex
CREATE INDEX "Fact_label_idx" ON "Fact"("label");

-- CreateIndex
CREATE INDEX "Fact_createdAt_idx" ON "Fact"("createdAt");

-- CreateIndex
CREATE INDEX "ContextHypothesis_workspaceId_idx" ON "ContextHypothesis"("workspaceId");

-- CreateIndex
CREATE INDEX "ContextHypothesis_type_idx" ON "ContextHypothesis"("type");

-- CreateIndex
CREATE INDEX "ContextHypothesis_certaintyLevel_idx" ON "ContextHypothesis"("certaintyLevel");

-- CreateIndex
CREATE INDEX "Obligation_workspaceId_idx" ON "Obligation"("workspaceId");

-- CreateIndex
CREATE INDEX "Obligation_contextId_idx" ON "Obligation"("contextId");

-- CreateIndex
CREATE INDEX "Obligation_deadline_idx" ON "Obligation"("deadline");

-- CreateIndex
CREATE INDEX "Obligation_critical_idx" ON "Obligation"("critical");

-- CreateIndex
CREATE INDEX "MissingElement_workspaceId_idx" ON "MissingElement"("workspaceId");

-- CreateIndex
CREATE INDEX "MissingElement_type_idx" ON "MissingElement"("type");

-- CreateIndex
CREATE INDEX "MissingElement_blocking_idx" ON "MissingElement"("blocking");

-- CreateIndex
CREATE INDEX "MissingElement_resolved_idx" ON "MissingElement"("resolved");

-- CreateIndex
CREATE INDEX "Risk_workspaceId_idx" ON "Risk"("workspaceId");

-- CreateIndex
CREATE INDEX "Risk_riskScore_idx" ON "Risk"("riskScore");

-- CreateIndex
CREATE INDEX "Risk_irreversible_idx" ON "Risk"("irreversible");

-- CreateIndex
CREATE INDEX "ProposedAction_workspaceId_idx" ON "ProposedAction"("workspaceId");

-- CreateIndex
CREATE INDEX "ProposedAction_type_idx" ON "ProposedAction"("type");

-- CreateIndex
CREATE INDEX "ProposedAction_executed_idx" ON "ProposedAction"("executed");

-- CreateIndex
CREATE INDEX "ProposedAction_priority_idx" ON "ProposedAction"("priority");

-- CreateIndex
CREATE INDEX "ReasoningTrace_workspaceId_idx" ON "ReasoningTrace"("workspaceId");

-- CreateIndex
CREATE INDEX "ReasoningTrace_createdAt_idx" ON "ReasoningTrace"("createdAt");

-- CreateIndex
CREATE INDEX "ReasoningTransition_workspaceId_triggeredAt_idx" ON "ReasoningTransition"("workspaceId", "triggeredAt");

-- CreateIndex
CREATE INDEX "ReasoningTransition_fromState_toState_idx" ON "ReasoningTransition"("fromState", "toState");

-- CreateIndex
CREATE INDEX "ReasoningTransition_triggeredBy_idx" ON "ReasoningTransition"("triggeredBy");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "UsageRecord_subscriptionId_idx" ON "UsageRecord"("subscriptionId");

-- CreateIndex
CREATE INDEX "UsageRecord_tenantId_idx" ON "UsageRecord"("tenantId");

-- CreateIndex
CREATE INDEX "UsageRecord_resourceType_idx" ON "UsageRecord"("resourceType");

-- CreateIndex
CREATE INDEX "UsageRecord_periodStart_periodEnd_idx" ON "UsageRecord"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUsageMetrics_period_key" ON "TenantUsageMetrics"("period");

-- CreateIndex
CREATE INDEX "TenantUsageMetrics_tenantId_period_idx" ON "TenantUsageMetrics"("tenantId", "period");

-- CreateIndex
CREATE INDEX "TenantUsageMetrics_periodStart_periodEnd_idx" ON "TenantUsageMetrics"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUsageMetrics_tenantId_period_key" ON "TenantUsageMetrics"("tenantId", "period");

-- CreateIndex
CREATE INDEX "QuotaEvent_tenantId_idx" ON "QuotaEvent"("tenantId");

-- CreateIndex
CREATE INDEX "QuotaEvent_quotaType_idx" ON "QuotaEvent"("quotaType");

-- CreateIndex
CREATE INDEX "QuotaEvent_eventType_idx" ON "QuotaEvent"("eventType");

-- CreateIndex
CREATE INDEX "QuotaEvent_occurredAt_idx" ON "QuotaEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_tenantId_occurredAt_idx" ON "AuditLogEntry"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_userId_occurredAt_idx" ON "AuditLogEntry"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_action_occurredAt_idx" ON "AuditLogEntry"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_objectType_objectId_idx" ON "AuditLogEntry"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_containsPersonalData_idx" ON "AuditLogEntry"("containsPersonalData");

-- CreateIndex
CREATE INDEX "ConsentRecord_tenantId_idx" ON "ConsentRecord"("tenantId");

-- CreateIndex
CREATE INDEX "ConsentRecord_clientId_idx" ON "ConsentRecord"("clientId");

-- CreateIndex
CREATE INDEX "ConsentRecord_consentType_idx" ON "ConsentRecord"("consentType");

-- CreateIndex
CREATE INDEX "ConsentRecord_granted_idx" ON "ConsentRecord"("granted");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_tenantId_idx" ON "DataSubjectRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_clientId_idx" ON "DataSubjectRequest"("clientId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_requestType_idx" ON "DataSubjectRequest"("requestType");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_dueDate_idx" ON "DataSubjectRequest"("dueDate");
