-- Restore schema objects required by the RLS and consent migrations.
-- This migration is idempotent because some environments may have applied
-- the standalone accounting SQL manually before Prisma tracked it.

DO $$ BEGIN
  CREATE TYPE "TypeCompte" AS ENUM ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeJournal" AS ENUM ('VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD', 'CARPA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutEcriture" AS ENUM ('BROUILLON', 'VALIDEE', 'LETTREE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SourceEcriture" AS ENUM ('MANUELLE', 'FACTURE', 'PAIEMENT', 'BANQUE', 'IA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RegimeTVA" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'ANNUEL_SIMPLIFIE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeMouvementCARPA" AS ENUM ('PROVISION', 'RESTITUTION', 'REGLEMENT_TIERS', 'HONORAIRES');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UserConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "accepted" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompteComptable" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "libelle" TEXT NOT NULL,
  "classe" INTEGER NOT NULL,
  "type" "TypeCompte" NOT NULL,
  "parentId" TEXT,
  "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompteComptable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Journal" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "libelle" TEXT NOT NULL,
  "type" "TypeJournal" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Ecriture" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "journalId" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "libelle" TEXT NOT NULL,
  "reference" TEXT,
  "factureId" TEXT,
  "dossierId" TEXT,
  "statut" "StatutEcriture" NOT NULL DEFAULT 'BROUILLON',
  "source" "SourceEcriture" NOT NULL DEFAULT 'MANUELLE',
  "validatedBy" TEXT,
  "validatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ecriture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LigneEcriture" (
  "id" TEXT NOT NULL,
  "ecritureId" TEXT NOT NULL,
  "compteId" TEXT NOT NULL,
  "libelle" TEXT,
  "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lettrage" TEXT,
  CONSTRAINT "LigneEcriture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MouvementBancaire" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "compteBancaire" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "libelle" TEXT NOT NULL,
  "montant" DOUBLE PRECISION NOT NULL,
  "reference" TEXT,
  "isRapproche" BOOLEAN NOT NULL DEFAULT false,
  "ecritureId" TEXT,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MouvementBancaire_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeclarationTVA" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "periode" TEXT NOT NULL,
  "regime" "RegimeTVA" NOT NULL,
  "tvaCollectee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tvaDeductible" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tvaNette" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "statut" TEXT NOT NULL DEFAULT 'brouillon',
  "dateLimite" TIMESTAMP(3) NOT NULL,
  "declaredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeclarationTVA_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MouvementCARPA" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "dossierId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "type" "TypeMouvementCARPA" NOT NULL,
  "montant" DOUBLE PRECISION NOT NULL,
  "libelle" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reference" TEXT,
  "soldeApres" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MouvementCARPA_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserConsent_userId_idx" ON "UserConsent"("userId");
CREATE INDEX IF NOT EXISTS "CompteComptable_tenantId_classe_idx" ON "CompteComptable"("tenantId", "classe");
CREATE INDEX IF NOT EXISTS "CompteComptable_tenantId_type_idx" ON "CompteComptable"("tenantId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "CompteComptable_tenantId_numero_key" ON "CompteComptable"("tenantId", "numero");
CREATE UNIQUE INDEX IF NOT EXISTS "Journal_tenantId_code_key" ON "Journal"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "Ecriture_tenantId_date_idx" ON "Ecriture"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Ecriture_tenantId_statut_idx" ON "Ecriture"("tenantId", "statut");
CREATE INDEX IF NOT EXISTS "Ecriture_factureId_idx" ON "Ecriture"("factureId");
CREATE INDEX IF NOT EXISTS "Ecriture_dossierId_idx" ON "Ecriture"("dossierId");
CREATE UNIQUE INDEX IF NOT EXISTS "Ecriture_tenantId_numero_key" ON "Ecriture"("tenantId", "numero");
CREATE INDEX IF NOT EXISTS "LigneEcriture_ecritureId_idx" ON "LigneEcriture"("ecritureId");
CREATE INDEX IF NOT EXISTS "LigneEcriture_compteId_idx" ON "LigneEcriture"("compteId");
CREATE INDEX IF NOT EXISTS "LigneEcriture_lettrage_idx" ON "LigneEcriture"("lettrage");
CREATE INDEX IF NOT EXISTS "MouvementBancaire_tenantId_date_idx" ON "MouvementBancaire"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "MouvementBancaire_tenantId_isRapproche_idx" ON "MouvementBancaire"("tenantId", "isRapproche");
CREATE UNIQUE INDEX IF NOT EXISTS "DeclarationTVA_tenantId_periode_key" ON "DeclarationTVA"("tenantId", "periode");
CREATE INDEX IF NOT EXISTS "MouvementCARPA_tenantId_dossierId_idx" ON "MouvementCARPA"("tenantId", "dossierId");
CREATE INDEX IF NOT EXISTS "MouvementCARPA_clientId_idx" ON "MouvementCARPA"("clientId");
CREATE INDEX IF NOT EXISTS "MouvementCARPA_date_idx" ON "MouvementCARPA"("date");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserConsent_userId_fkey' AND conrelid = '"UserConsent"'::regclass) THEN
    ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompteComptable_tenantId_fkey' AND conrelid = '"CompteComptable"'::regclass) THEN
    ALTER TABLE "CompteComptable" ADD CONSTRAINT "CompteComptable_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompteComptable_parentId_fkey' AND conrelid = '"CompteComptable"'::regclass) THEN
    ALTER TABLE "CompteComptable" ADD CONSTRAINT "CompteComptable_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "CompteComptable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Journal_tenantId_fkey' AND conrelid = '"Journal"'::regclass) THEN
    ALTER TABLE "Journal" ADD CONSTRAINT "Journal_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ecriture_journalId_fkey' AND conrelid = '"Ecriture"'::regclass) THEN
    ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_journalId_fkey"
      FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ecriture_tenantId_fkey' AND conrelid = '"Ecriture"'::regclass) THEN
    ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LigneEcriture_ecritureId_fkey' AND conrelid = '"LigneEcriture"'::regclass) THEN
    ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_ecritureId_fkey"
      FOREIGN KEY ("ecritureId") REFERENCES "Ecriture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LigneEcriture_compteId_fkey' AND conrelid = '"LigneEcriture"'::regclass) THEN
    ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_compteId_fkey"
      FOREIGN KEY ("compteId") REFERENCES "CompteComptable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MouvementBancaire_tenantId_fkey' AND conrelid = '"MouvementBancaire"'::regclass) THEN
    ALTER TABLE "MouvementBancaire" ADD CONSTRAINT "MouvementBancaire_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DeclarationTVA_tenantId_fkey' AND conrelid = '"DeclarationTVA"'::regclass) THEN
    ALTER TABLE "DeclarationTVA" ADD CONSTRAINT "DeclarationTVA_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MouvementCARPA_tenantId_fkey' AND conrelid = '"MouvementCARPA"'::regclass) THEN
    ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MouvementCARPA_dossierId_fkey' AND conrelid = '"MouvementCARPA"'::regclass) THEN
    ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_dossierId_fkey"
      FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MouvementCARPA_clientId_fkey' AND conrelid = '"MouvementCARPA"'::regclass) THEN
    ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
