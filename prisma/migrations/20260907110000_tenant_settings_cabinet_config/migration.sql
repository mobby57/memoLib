-- Incrément 1 — Configuration cabinet administrable via /settings.
-- Ajoute des champs de configuration au modèle TenantSettings.
-- Migration purement additive : toutes les colonnes sont nullables ou ont une
-- valeur par défaut, donc rétrocompatible avec les lignes existantes.

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetName" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetLogo" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetAddress" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetPhone" TEXT;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetEmail" TEXT;

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "defaultLanguage" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "defaultTimezone" TEXT NOT NULL DEFAULT 'Europe/Paris';
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY';

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "deadlineNotifications" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "ocrEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "maxUploadSizeMb" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "maxFilesPerUpload" INTEGER NOT NULL DEFAULT 5;
