-- Migration: fix_access_grant_schema
-- Date: 2026-11-17
-- Purpose: Ajouter les colonnes manquantes et les FK à AccessGrant et Invitation
-- Issue: La migration précédente (20261116120000) a créé les tables sans toutes les colonnes requises par schema.prisma

-- ============================================
-- 1. Ajouter les colonnes manquantes à AccessGrant
-- ============================================

ALTER TABLE "AccessGrant" ADD COLUMN "dossierId" TEXT NOT NULL;
ALTER TABLE "AccessGrant" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AccessGrant" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 2. Créer l'enum AccessGrantStatus
-- ============================================

DO $$ BEGIN
  CREATE TYPE "AccessGrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. Convertir colonne status en type enum
-- ============================================

ALTER TABLE "AccessGrant" ALTER COLUMN "status" TYPE "AccessGrantStatus" USING "status"::"AccessGrantStatus";

-- ============================================
-- 4. Ajouter les contraintes de clé étrangère
-- ============================================

-- FK: AccessGrant -> Invitation
ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_invitationId_fkey"
  FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE;

-- FK: AccessGrant -> User (clientUser)
ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_clientUserId_fkey"
  FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE;

-- FK: AccessGrant -> Dossier
ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE;

-- ============================================
-- 5. Ajouter les contraintes de clé étrangère à Invitation (si elles n'existent pas)
-- ============================================

-- FK: Invitation -> Dossier
ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE;

-- FK: Invitation -> User (lawyer)
ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_lawyerId_fkey"
  FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT;

-- ============================================
-- 6. Ajouter les indices manquants à AccessGrant
-- ============================================

CREATE INDEX IF NOT EXISTS "AccessGrant_dossierId_idx" ON "AccessGrant"("dossierId");
CREATE INDEX IF NOT EXISTS "AccessGrant_expiresAt_idx" ON "AccessGrant"("expiresAt");

-- ============================================
-- 7. Ajouter les contraintes UNIQUE
-- ============================================

-- UNIQUE: (invitationId, clientUserId)
ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_invitationId_clientUserId_key"
  UNIQUE ("invitationId", "clientUserId");
