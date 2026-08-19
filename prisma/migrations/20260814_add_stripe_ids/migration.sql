-- AlterTable: Add Stripe fields for SaaS provisioning
-- Tenant: stripeCustomerId for Stripe customer linking
-- Subscription: stripeSubscriptionId for Stripe subscription linking

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- Dossier: confidentialMode — forces local-only AI (no cloud providers)
ALTER TABLE "Dossier" ADD COLUMN IF NOT EXISTS "confidentialMode" BOOLEAN NOT NULL DEFAULT false;

-- TimeEntry: time tracking for lawyers (billable hours)
CREATE TABLE IF NOT EXISTS "TimeEntry" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dossierId" TEXT,
  "clientId" TEXT,
  "description" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "duration" INTEGER NOT NULL,
  "tarifHoraire" DOUBLE PRECISION,
  "montant" DOUBLE PRECISION,
  "isBillable" BOOLEAN NOT NULL DEFAULT true,
  "isBilled" BOOLEAN NOT NULL DEFAULT false,
  "factureId" TEXT,
  "category" TEXT NOT NULL DEFAULT 'travail',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TimeEntry_tenantId_userId_idx" ON "TimeEntry"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "TimeEntry_tenantId_dossierId_idx" ON "TimeEntry"("tenantId", "dossierId");
CREATE INDEX IF NOT EXISTS "TimeEntry_tenantId_date_idx" ON "TimeEntry"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "TimeEntry_isBillable_isBilled_idx" ON "TimeEntry"("isBillable", "isBilled");

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
