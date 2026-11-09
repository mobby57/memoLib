CREATE TABLE IF NOT EXISTS "LegalDeadline" (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "dossierId" TEXT REFERENCES "Dossier"(id),
  title TEXT NOT NULL,
  description TEXT,
  "dueDate" TIMESTAMP NOT NULL,
  type TEXT DEFAULT 'CUSTOM',
  status TEXT DEFAULT 'PENDING',
  "createdBy" TEXT,
  "alertJ7Sent" BOOLEAN DEFAULT false,
  "alertJ3Sent" BOOLEAN DEFAULT false,
  "alertJ1Sent" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DeadlineAlert" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "deadlineId" TEXT NOT NULL REFERENCES "LegalDeadline"(id) ON DELETE CASCADE,
  "alertType" TEXT NOT NULL,
  "sentTo" TEXT,
  channel TEXT DEFAULT 'email',
  "sentAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LegalDeadline_tenantId_idx" ON "LegalDeadline"("tenantId");
CREATE INDEX IF NOT EXISTS "LegalDeadline_dueDate_idx" ON "LegalDeadline"("dueDate");
CREATE INDEX IF NOT EXISTS "LegalDeadline_status_idx" ON "LegalDeadline"(status);
CREATE INDEX IF NOT EXISTS "DeadlineAlert_deadlineId_idx" ON "DeadlineAlert"("deadlineId");
