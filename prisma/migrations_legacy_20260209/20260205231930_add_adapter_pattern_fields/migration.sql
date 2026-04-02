-- AlterTable
ALTER TABLE "channel_messages"
ADD COLUMN "externalId" TEXT,
ADD COLUMN "checksum" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "channel_messages_checksum_key" ON "channel_messages"("checksum");

-- CreateIndex
CREATE INDEX "channel_messages_externalId_idx" ON "channel_messages"("externalId");

-- CreateIndex
CREATE INDEX "channel_messages_checksum_idx" ON "channel_messages"("checksum");

-- Remplir checksum pour les données existantes (hash basique)
UPDATE "channel_messages"
SET "checksum" = md5(CONCAT(id, channel, COALESCE(body, ''), COALESCE(subject, '')))::text
WHERE "checksum" = '';
