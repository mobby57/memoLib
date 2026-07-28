-- Indexes performance: tenantId, status, createdAt composites

CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "LegalDeadline_tenantId_status_idx" ON "LegalDeadline"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "LegalDeadline_tenantId_createdAt_idx" ON "LegalDeadline"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "LegalDeadline_tenantId_status_createdAt_idx" ON "LegalDeadline"("tenantId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "Draft_tenantId_createdAt_idx" ON "Draft"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "Draft_tenantId_status_createdAt_idx" ON "Draft"("tenantId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "Report_tenantId_status_idx" ON "Report"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Report_tenantId_createdAt_idx" ON "Report"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_tenantId_status_createdAt_idx" ON "Report"("tenantId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "WorkflowExecution_tenantId_createdAt_idx" ON "WorkflowExecution"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_tenantId_status_createdAt_idx" ON "WorkflowExecution"("tenantId", "status", "createdAt");
