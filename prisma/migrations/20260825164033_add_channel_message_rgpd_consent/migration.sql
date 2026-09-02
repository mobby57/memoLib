-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'VOICE', 'SLACK', 'TEAMS', 'LINKEDIN', 'TWITTER', 'FORM', 'DOCUMENT', 'DECLAN', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ChannelMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ChannelMessageStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'RGPD_DATA_EXPORT';
ALTER TYPE "AuditAction" ADD VALUE 'RGPD_DELETION_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'RGPD_DELETION_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'RETENTION_POLICY_APPLIED';
ALTER TYPE "AuditAction" ADD VALUE 'DUPLICATE_MESSAGE_DETECTED';
ALTER TYPE "AuditAction" ADD VALUE 'WEBHOOK_SIGNATURE_INVALID';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "actorType" TEXT,
ADD COLUMN     "channel" "Channel",
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceType" TEXT;

-- CreateTable
CREATE TABLE "ChannelMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT,
    "checksum" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "direction" "ChannelMessageDirection" NOT NULL DEFAULT 'INBOUND',
    "status" "ChannelMessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "senderData" JSONB,
    "recipientData" JSONB,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "attachments" JSONB,
    "channelMetadata" JSONB,
    "aiSummary" TEXT,
    "aiCategory" TEXT,
    "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiUrgency" TEXT,
    "consentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "auditTrail" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "dossierId" TEXT,

    CONSTRAINT "ChannelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RGPDConsent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "proofDocument" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RGPDConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMessage_checksum_key" ON "ChannelMessage"("checksum");

-- CreateIndex
CREATE INDEX "ChannelMessage_tenantId_idx" ON "ChannelMessage"("tenantId");

-- CreateIndex
CREATE INDEX "ChannelMessage_channel_idx" ON "ChannelMessage"("channel");

-- CreateIndex
CREATE INDEX "ChannelMessage_status_idx" ON "ChannelMessage"("status");

-- CreateIndex
CREATE INDEX "ChannelMessage_clientId_idx" ON "ChannelMessage"("clientId");

-- CreateIndex
CREATE INDEX "ChannelMessage_dossierId_idx" ON "ChannelMessage"("dossierId");

-- CreateIndex
CREATE INDEX "ChannelMessage_receivedAt_idx" ON "ChannelMessage"("receivedAt");

-- CreateIndex
CREATE INDEX "RGPDConsent_clientId_idx" ON "RGPDConsent"("clientId");

-- CreateIndex
CREATE INDEX "RGPDConsent_channel_idx" ON "RGPDConsent"("channel");

-- CreateIndex
CREATE INDEX "AuditLog_clientId_idx" ON "AuditLog"("clientId");

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RGPDConsent" ADD CONSTRAINT "RGPDConsent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
