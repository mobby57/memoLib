-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FLOW_RECEIVED', 'FLOW_NORMALIZED', 'FLOW_CLASSIFIED', 'USER_VALIDATED_SUGGESTION', 'USER_REJECTED_SUGGESTION', 'USER_ASSIGNED_FLOW', 'USER_ASSIGNED_DOSSIER', 'DUPLICATE_DETECTED', 'DUPLICATE_MERGED', 'DUPLICATE_DISMISSED', 'USER_ADDED_COMMENT', 'USER_MENTIONED', 'ACCESS_LOGIN', 'ACCESS_LOGOUT', 'ACCESS_VIEWED_FLOW', 'ACCESS_DOWNLOADED_ATTACHMENT', 'ACCESS_EXPORTED_AUDIT', 'ACCESS_FORBIDDEN', 'SYSTEM_ERROR', 'SYSTEM_MAINTENANCE', 'WORKFLOW_STARTED', 'WORKFLOW_COMPLETED', 'WORKFLOW_FAILED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'SYSTEM', 'AI');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'VOICE', 'SLACK', 'TEAMS', 'LINKEDIN', 'TWITTER', 'FORM', 'DOCUMENT', 'DECLAN', 'INTERNAL');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED', 'NOT_REQUIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "EventType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "checksum" TEXT NOT NULL,
    "previousEventId" TEXT,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_messages" (
    "id" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "direction" "MessageDirection" NOT NULL DEFAULT 'INBOUND',
    "status" "MessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "senderData" JSONB NOT NULL,
    "recipientData" JSONB,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "channelMetadata" JSONB NOT NULL DEFAULT '{}',
    "aiSummary" TEXT,
    "aiCategory" TEXT,
    "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiUrgency" "UrgencyLevel",
    "aiSentiment" TEXT,
    "aiEntities" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "auditTrail" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rgpd_consents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "proofDocument" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rgpd_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "consentRequired" BOOLEAN NOT NULL DEFAULT true,
    "autoArchive" BOOLEAN NOT NULL DEFAULT false,
    "archiveAfterDays" INTEGER NOT NULL DEFAULT 365,
    "aiProcessing" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "keyVaultSecretName" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "endpoint" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_monthly_summaries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ollamaTokens" INTEGER NOT NULL DEFAULT 0,
    "cloudflareTokens" INTEGER NOT NULL DEFAULT 0,
    "cloudflareCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetUsedPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "avgLatencyMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OAuthToken_userId_idx" ON "OAuthToken"("userId");

-- CreateIndex
CREATE INDEX "OAuthToken_provider_idx" ON "OAuthToken"("provider");

-- CreateIndex
CREATE INDEX "OAuthToken_revokedAt_idx" ON "OAuthToken"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_userId_provider_key" ON "OAuthToken"("userId", "provider");

-- CreateIndex
CREATE INDEX "event_logs_tenantId_idx" ON "event_logs"("tenantId");

-- CreateIndex
CREATE INDEX "event_logs_timestamp_idx" ON "event_logs"("timestamp");

-- CreateIndex
CREATE INDEX "event_logs_eventType_idx" ON "event_logs"("eventType");

-- CreateIndex
CREATE INDEX "event_logs_entityType_entityId_idx" ON "event_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "event_logs_actorId_idx" ON "event_logs"("actorId");

-- CreateIndex
CREATE INDEX "channel_messages_tenantId_idx" ON "channel_messages"("tenantId");

-- CreateIndex
CREATE INDEX "channel_messages_clientId_idx" ON "channel_messages"("clientId");

-- CreateIndex
CREATE INDEX "channel_messages_dossierId_idx" ON "channel_messages"("dossierId");

-- CreateIndex
CREATE INDEX "channel_messages_channel_idx" ON "channel_messages"("channel");

-- CreateIndex
CREATE INDEX "channel_messages_status_idx" ON "channel_messages"("status");

-- CreateIndex
CREATE INDEX "channel_messages_aiUrgency_idx" ON "channel_messages"("aiUrgency");

-- CreateIndex
CREATE INDEX "channel_messages_receivedAt_idx" ON "channel_messages"("receivedAt");

-- CreateIndex
CREATE INDEX "channel_messages_consentStatus_idx" ON "channel_messages"("consentStatus");

-- CreateIndex
CREATE INDEX "rgpd_consents_clientId_idx" ON "rgpd_consents"("clientId");

-- CreateIndex
CREATE INDEX "rgpd_consents_channel_idx" ON "rgpd_consents"("channel");

-- CreateIndex
CREATE INDEX "rgpd_consents_granted_idx" ON "rgpd_consents"("granted");

-- CreateIndex
CREATE INDEX "rgpd_consents_expiresAt_idx" ON "rgpd_consents"("expiresAt");

-- CreateIndex
CREATE INDEX "channel_configs_tenantId_idx" ON "channel_configs"("tenantId");

-- CreateIndex
CREATE INDEX "channel_configs_channel_idx" ON "channel_configs"("channel");

-- CreateIndex
CREATE INDEX "channel_configs_enabled_idx" ON "channel_configs"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "channel_configs_tenantId_channel_key" ON "channel_configs"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "ai_usage_logs_tenantId_idx" ON "ai_usage_logs"("tenantId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_provider_idx" ON "ai_usage_logs"("provider");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_logs_tenantId_createdAt_idx" ON "ai_usage_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_monthly_summaries_tenantId_idx" ON "ai_monthly_summaries"("tenantId");

-- CreateIndex
CREATE INDEX "ai_monthly_summaries_year_month_idx" ON "ai_monthly_summaries"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ai_monthly_summaries_tenantId_year_month_key" ON "ai_monthly_summaries"("tenantId", "year", "month");

-- AddForeignKey
ALTER TABLE "OAuthToken" ADD CONSTRAINT "OAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rgpd_consents" ADD CONSTRAINT "rgpd_consents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_configs" ADD CONSTRAINT "channel_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_monthly_summaries" ADD CONSTRAINT "ai_monthly_summaries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
