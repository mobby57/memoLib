-- Checklist items par dossier
CREATE TABLE "DossierChecklistItem" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'document',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "documentId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receivedVia" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierChecklistItem_pkey" PRIMARY KEY ("id")
);

-- Email inbox par dossier
ALTER TABLE "Dossier" ADD COLUMN "inboxEmail" TEXT;
ALTER TABLE "Dossier" ADD COLUMN "checklistComplete" BOOLEAN DEFAULT false;
ALTER TABLE "Dossier" ADD COLUMN "checklistTotal" INTEGER DEFAULT 0;
ALTER TABLE "Dossier" ADD COLUMN "checklistReceived" INTEGER DEFAULT 0;

-- Index
CREATE INDEX "DossierChecklistItem_dossierId_idx" ON "DossierChecklistItem"("dossierId");
CREATE INDEX "DossierChecklistItem_status_idx" ON "DossierChecklistItem"("dossierId", "status");
CREATE INDEX "Dossier_inboxEmail_idx" ON "Dossier"("inboxEmail");
