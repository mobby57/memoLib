-- Migration: Add hash chain fields to AuditLog for tamper-proof audit trail
-- Obligation: RGPD Art. 5 (intégrité), valeur probante (pré-eIDAS)

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "hash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "previousHash" TEXT;

-- Index pour vérification rapide de la chaîne
CREATE INDEX IF NOT EXISTS "AuditLog_hash_idx" ON "AuditLog" ("hash");

-- Commenter pour documentation
COMMENT ON COLUMN "AuditLog"."hash" IS 'SHA-256 hash de cette entrée (payload + previousHash). Garantit l''intégrité.';
COMMENT ON COLUMN "AuditLog"."previousHash" IS 'Hash de l''entrée précédente dans la chaîne. Détecte toute modification.';
