-- Align Invitation and AccessGrant with the composite tenant relations in
-- schema.prisma. Fail rather than assigning orphan rows to an arbitrary tenant.

ALTER TABLE "Invitation"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Invitation" AS invitation
SET "tenantId" = dossier."tenantId"
FROM "Dossier" AS dossier
WHERE invitation."dossierId" = dossier."id"
  AND invitation."tenantId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Invitation" WHERE "tenantId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot infer tenantId for one or more Invitation rows';
  END IF;
END
$$;

ALTER TABLE "Invitation" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "AccessGrant"
  ADD COLUMN IF NOT EXISTS "dossierId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE "AccessGrant" AS grant_row
SET "tenantId" = invitation."tenantId",
    "dossierId" = invitation."dossierId"
FROM "Invitation" AS invitation
WHERE grant_row."invitationId" = invitation."id"
  AND (grant_row."tenantId" IS NULL OR grant_row."dossierId" IS NULL);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "AccessGrant"
    WHERE "tenantId" IS NULL OR "dossierId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot infer tenantId or dossierId for one or more AccessGrant rows';
  END IF;
END
$$;

DO $$ BEGIN
  CREATE TYPE "AccessGrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "AccessGrant"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AccessGrantStatus"
  USING "status"::"AccessGrantStatus",
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"AccessGrantStatus";

ALTER TABLE "AccessGrant"
  ALTER COLUMN "tenantId" SET NOT NULL,
  ALTER COLUMN "dossierId" SET NOT NULL,
  ALTER COLUMN "expiresAt" DROP NOT NULL;

DROP INDEX IF EXISTS "AccessGrant_invitationId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Dossier_id_tenantId_key"
  ON "Dossier"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_id_tenantId_key"
  ON "User"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_id_tenantId_key"
  ON "Invitation"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "AccessGrant_invitationId_tenantId_key"
  ON "AccessGrant"("invitationId", "tenantId");
CREATE INDEX IF NOT EXISTS "Invitation_tenantId_dossierId_email_status_idx"
  ON "Invitation"("tenantId", "dossierId", "email", "status");
CREATE INDEX IF NOT EXISTS "Invitation_expiresAt_idx"
  ON "Invitation"("expiresAt");
CREATE INDEX IF NOT EXISTS "AccessGrant_tenantId_dossierId_idx"
  ON "AccessGrant"("tenantId", "dossierId");
CREATE INDEX IF NOT EXISTS "AccessGrant_tenantId_clientUserId_idx"
  ON "AccessGrant"("tenantId", "clientUserId");
CREATE INDEX IF NOT EXISTS "AccessGrant_expiresAt_idx"
  ON "AccessGrant"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invitation_tenantId_fkey' AND conrelid = '"Invitation"'::regclass) THEN
    ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invitation_dossierId_tenantId_fkey' AND conrelid = '"Invitation"'::regclass) THEN
    ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_dossierId_tenantId_fkey"
      FOREIGN KEY ("dossierId", "tenantId") REFERENCES "Dossier"("id", "tenantId")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invitation_lawyerId_tenantId_fkey' AND conrelid = '"Invitation"'::regclass) THEN
    ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_lawyerId_tenantId_fkey"
      FOREIGN KEY ("lawyerId", "tenantId") REFERENCES "User"("id", "tenantId")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccessGrant_tenantId_fkey' AND conrelid = '"AccessGrant"'::regclass) THEN
    ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccessGrant_invitationId_tenantId_fkey' AND conrelid = '"AccessGrant"'::regclass) THEN
    ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_invitationId_tenantId_fkey"
      FOREIGN KEY ("invitationId", "tenantId") REFERENCES "Invitation"("id", "tenantId")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccessGrant_clientUserId_fkey' AND conrelid = '"AccessGrant"'::regclass) THEN
    ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_clientUserId_fkey"
      FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccessGrant_dossierId_tenantId_fkey' AND conrelid = '"AccessGrant"'::regclass) THEN
    ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_dossierId_tenantId_fkey"
      FOREIGN KEY ("dossierId", "tenantId") REFERENCES "Dossier"("id", "tenantId")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
