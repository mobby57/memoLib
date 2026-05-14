-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "extractedData" TEXT NOT NULL,
    "confidence" TEXT,
    "sourceEmailId" TEXT,
    "createdDossierId" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Draft_tenantId_status_idx" ON "Draft"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Draft_sourceEmailId_idx" ON "Draft"("sourceEmailId");

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_sourceEmailId_fkey"
    FOREIGN KEY ("sourceEmailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_createdDossierId_fkey"
    FOREIGN KEY ("createdDossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
