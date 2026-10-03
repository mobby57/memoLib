-- Demande d'intake client (IntakeRequest). Données sensibles chiffrées au
-- niveau applicatif (colonnes *Enc / encryptedData). Migration additive.

CREATE TABLE IF NOT EXISTS "IntakeRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "origin" TEXT NOT NULL DEFAULT 'manual',
    "sourceRef" TEXT,
    "clientEmailEnc" TEXT,
    "clientEmailHash" TEXT,
    "encryptedData" TEXT,
    "requiredFields" JSONB,
    "requiredDocuments" JSONB,
    "providedDocuments" JSONB,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntakeRequest_tenantId_origin_sourceRef_key"
ON "IntakeRequest"("tenantId", "origin", "sourceRef");

CREATE INDEX IF NOT EXISTS "IntakeRequest_tenantId_status_idx"
ON "IntakeRequest"("tenantId", "status");

CREATE INDEX IF NOT EXISTS "IntakeRequest_clientEmailHash_idx"
ON "IntakeRequest"("clientEmailHash");

CREATE INDEX IF NOT EXISTS "IntakeRequest_status_idx"
ON "IntakeRequest"("status");
