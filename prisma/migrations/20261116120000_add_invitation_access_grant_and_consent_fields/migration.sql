-- Migration: add_invitation_access_grant_and_consent_fields
-- Date: 2026-11-16
-- Note: responsableId n'est PAS modifie (present depuis 20260209000000_init)

-- 1. Nouveaux champs Dossier
ALTER TABLE "Dossier" ADD COLUMN "clientNom"     TEXT;
ALTER TABLE "Dossier" ADD COLUMN "clientPrenom"  TEXT;
ALTER TABLE "Dossier" ADD COLUMN "clientAdresse" TEXT;
ALTER TABLE "Dossier" ADD COLUMN "recitClient"   TEXT;

-- 2. Nouveaux champs UserConsent
ALTER TABLE "UserConsent" ADD COLUMN "ipAddress"     TEXT;
ALTER TABLE "UserConsent" ADD COLUMN "userAgent"     TEXT;
ALTER TABLE "UserConsent" ADD COLUMN "policyVersion" TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE "UserConsent" ADD COLUMN "grantedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Enum InvitationStatus
DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Table Invitation
CREATE TABLE IF NOT EXISTS "Invitation" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "dossierId" TEXT NOT NULL,
  "lawyerId"  TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status"    "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX IF NOT EXISTS "Invitation_dossierId_idx" ON "Invitation"("dossierId");
CREATE INDEX IF NOT EXISTS "Invitation_lawyerId_idx"  ON "Invitation"("lawyerId");

-- 5. Table AccessGrant
CREATE TABLE IF NOT EXISTS "AccessGrant" (
  "id"           TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "clientUserId" TEXT NOT NULL,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "revokedAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccessGrant_invitationId_key" ON "AccessGrant"("invitationId");
CREATE INDEX IF NOT EXISTS "AccessGrant_clientUserId_idx" ON "AccessGrant"("clientUserId");