-- Préférences utilisateur (clé/valeur JSON) — modèle UserPreference.
-- Migration additive : création d'une nouvelle table, aucune donnée existante
-- affectée.

CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key_key"
ON "UserPreference"("userId", "key");

CREATE INDEX IF NOT EXISTS "UserPreference_userId_idx"
ON "UserPreference"("userId");

CREATE INDEX IF NOT EXISTS "UserPreference_tenantId_idx"
ON "UserPreference"("tenantId");

-- ADD CONSTRAINT n'est pas idempotent en PostgreSQL. On l'enveloppe dans un
-- bloc DO qui attrape l'erreur "duplicate_object" si la contrainte existe déjà.
DO $$
BEGIN
  ALTER TABLE "UserPreference"
    ADD CONSTRAINT "UserPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
