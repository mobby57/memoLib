-- Migration: Add encrypted body fields to Email for at-rest encryption
-- Obligation: Secret professionnel (Art. 66-5), RGPD Art. 32 (sécurité du traitement)

ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "bodyEncrypted" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "htmlBodyEncrypted" TEXT;

COMMENT ON COLUMN "Email"."bodyEncrypted" IS 'AES-256-GCM encrypted email body. Format: JSON {encrypted, iv, authTag, version}';
COMMENT ON COLUMN "Email"."htmlBodyEncrypted" IS 'AES-256-GCM encrypted HTML body. Format: JSON {encrypted, iv, authTag, version}';
