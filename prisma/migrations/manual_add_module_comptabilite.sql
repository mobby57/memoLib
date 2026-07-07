-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT');

-- CreateEnum
CREATE TYPE "TypeJournal" AS ENUM ('VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD', 'CARPA');

-- CreateEnum
CREATE TYPE "StatutEcriture" AS ENUM ('BROUILLON', 'VALIDEE', 'LETTREE');

-- CreateEnum
CREATE TYPE "SourceEcriture" AS ENUM ('MANUELLE', 'FACTURE', 'PAIEMENT', 'BANQUE', 'IA');

-- CreateEnum
CREATE TYPE "RegimeTVA" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'ANNUEL_SIMPLIFIE');

-- CreateEnum
CREATE TYPE "TypeMouvementCARPA" AS ENUM ('PROVISION', 'RESTITUTION', 'REGLEMENT_TIERS', 'HONORAIRES');

-- CreateTable
CREATE TABLE "CompteComptable" (
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

-- CreateTable
CREATE TABLE "Journal" (
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

-- CreateTable
CREATE TABLE "Ecriture" (
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

-- CreateTable
CREATE TABLE "LigneEcriture" (
    "id" TEXT NOT NULL,
    "ecritureId" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "libelle" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lettrage" TEXT,

    CONSTRAINT "LigneEcriture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementBancaire" (
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

-- CreateTable
CREATE TABLE "DeclarationTVA" (
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

-- CreateTable
CREATE TABLE "MouvementCARPA" (
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

-- CreateIndex
CREATE INDEX "CompteComptable_tenantId_classe_idx" ON "CompteComptable"("tenantId", "classe");

-- CreateIndex
CREATE INDEX "CompteComptable_tenantId_type_idx" ON "CompteComptable"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CompteComptable_tenantId_numero_key" ON "CompteComptable"("tenantId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_tenantId_code_key" ON "Journal"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Ecriture_tenantId_date_idx" ON "Ecriture"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Ecriture_tenantId_statut_idx" ON "Ecriture"("tenantId", "statut");

-- CreateIndex
CREATE INDEX "Ecriture_factureId_idx" ON "Ecriture"("factureId");

-- CreateIndex
CREATE INDEX "Ecriture_dossierId_idx" ON "Ecriture"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Ecriture_tenantId_numero_key" ON "Ecriture"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "LigneEcriture_ecritureId_idx" ON "LigneEcriture"("ecritureId");

-- CreateIndex
CREATE INDEX "LigneEcriture_compteId_idx" ON "LigneEcriture"("compteId");

-- CreateIndex
CREATE INDEX "LigneEcriture_lettrage_idx" ON "LigneEcriture"("lettrage");

-- CreateIndex
CREATE INDEX "MouvementBancaire_tenantId_date_idx" ON "MouvementBancaire"("tenantId", "date");

-- CreateIndex
CREATE INDEX "MouvementBancaire_tenantId_isRapproche_idx" ON "MouvementBancaire"("tenantId", "isRapproche");

-- CreateIndex
CREATE UNIQUE INDEX "DeclarationTVA_tenantId_periode_key" ON "DeclarationTVA"("tenantId", "periode");

-- CreateIndex
CREATE INDEX "MouvementCARPA_tenantId_dossierId_idx" ON "MouvementCARPA"("tenantId", "dossierId");

-- CreateIndex
CREATE INDEX "MouvementCARPA_clientId_idx" ON "MouvementCARPA"("clientId");

-- CreateIndex
CREATE INDEX "MouvementCARPA_date_idx" ON "MouvementCARPA"("date");

-- AddForeignKey
ALTER TABLE "CompteComptable" ADD CONSTRAINT "CompteComptable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteComptable" ADD CONSTRAINT "CompteComptable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CompteComptable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_ecritureId_fkey" FOREIGN KEY ("ecritureId") REFERENCES "Ecriture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "CompteComptable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementBancaire" ADD CONSTRAINT "MouvementBancaire_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationTVA" ADD CONSTRAINT "DeclarationTVA_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

