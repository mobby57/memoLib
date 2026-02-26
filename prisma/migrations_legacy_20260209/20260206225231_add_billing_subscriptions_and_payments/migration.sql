-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "GitHubEventType" AS ENUM ('PUSH', 'PULL_REQUEST', 'ISSUES', 'ISSUE_COMMENT', 'WORKFLOW_RUN', 'CHECK_RUN', 'REPOSITORY', 'MEMBER');

-- CreateEnum
CREATE TYPE "LegalProofType" AS ENUM ('DOCUMENT', 'ACTION', 'COMMUNICATION', 'TRANSACTION', 'VALIDATION');

-- CreateEnum
CREATE TYPE "LegalSignatureType" AS ENUM ('SIMPLE', 'ADVANCED', 'QUALIFIED');

-- CreateEnum
CREATE TYPE "LegalProofFormat" AS ENUM ('JSON', 'PDF', 'XML', 'BLOCKCHAIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'GITHUB_EVENT_RECEIVED';
ALTER TYPE "EventType" ADD VALUE 'GITHUB_EVENT_PROCESSED';
ALTER TYPE "EventType" ADD VALUE 'GITHUB_EVENT_LINKED';
ALTER TYPE "EventType" ADD VALUE 'GITHUB_EVENT_ERROR';
ALTER TYPE "EventType" ADD VALUE 'ANALYSIS_PIPELINE_EXECUTED';
ALTER TYPE "EventType" ADD VALUE 'ANALYSIS_RULE_APPLIED';
ALTER TYPE "EventType" ADD VALUE 'DUPLICATE_PROPOSED_FOR_LINKING';
ALTER TYPE "EventType" ADD VALUE 'DEADLINE_EXTRACTED';

-- AlterTable
ALTER TABLE "channel_messages" ALTER COLUMN "checksum" DROP DEFAULT;

-- CreateTable
CREATE TABLE "github_event_logs" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "eventType" "GitHubEventType" NOT NULL,
    "action" TEXT,
    "eventHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "repository" TEXT,
    "sender" TEXT,
    "senderEmail" TEXT,
    "installationId" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "dossierId" TEXT,
    "clientId" TEXT,
    "tenantId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_proofs" (
    "id" TEXT NOT NULL,
    "type" "LegalProofType" NOT NULL,
    "content" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'SHA-256',
    "hashChain" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "timestampToken" TEXT,
    "timestampAuthority" TEXT,
    "timestampCertificat" TEXT,
    "signatures" JSONB NOT NULL DEFAULT '[]',
    "jurisdiction" TEXT,
    "legalBasis" TEXT,
    "retention" INTEGER,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "expiration" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "maxClients" INTEGER NOT NULL DEFAULT 5,
    "maxDossiers" INTEGER NOT NULL DEFAULT 10,
    "maxStorage" INTEGER NOT NULL DEFAULT 1024,
    "hasAIFeatures" BOOLEAN NOT NULL DEFAULT false,
    "hasAdvancedReports" BOOLEAN NOT NULL DEFAULT false,
    "hasAPIAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasPrioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "billingEmail" TEXT,
    "billingName" TEXT,
    "billingAddress" JSONB,
    "paymentMethod" TEXT,
    "last4" TEXT,
    "brand" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "stripeEventId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_event_logs_deliveryId_key" ON "github_event_logs"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "github_event_logs_eventHash_key" ON "github_event_logs"("eventHash");

-- CreateIndex
CREATE INDEX "github_event_logs_eventType_idx" ON "github_event_logs"("eventType");

-- CreateIndex
CREATE INDEX "github_event_logs_repository_idx" ON "github_event_logs"("repository");

-- CreateIndex
CREATE INDEX "github_event_logs_sender_idx" ON "github_event_logs"("sender");

-- CreateIndex
CREATE INDEX "github_event_logs_receivedAt_idx" ON "github_event_logs"("receivedAt");

-- CreateIndex
CREATE INDEX "github_event_logs_dossierId_idx" ON "github_event_logs"("dossierId");

-- CreateIndex
CREATE INDEX "github_event_logs_clientId_idx" ON "github_event_logs"("clientId");

-- CreateIndex
CREATE INDEX "github_event_logs_tenantId_idx" ON "github_event_logs"("tenantId");

-- CreateIndex
CREATE INDEX "github_event_logs_processed_idx" ON "github_event_logs"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "legal_proofs_hash_key" ON "legal_proofs"("hash");

-- CreateIndex
CREATE INDEX "legal_proofs_type_idx" ON "legal_proofs"("type");

-- CreateIndex
CREATE INDEX "legal_proofs_userId_idx" ON "legal_proofs"("userId");

-- CreateIndex
CREATE INDEX "legal_proofs_dossierId_idx" ON "legal_proofs"("dossierId");

-- CreateIndex
CREATE INDEX "legal_proofs_clientId_idx" ON "legal_proofs"("clientId");

-- CreateIndex
CREATE INDEX "legal_proofs_tenantId_idx" ON "legal_proofs"("tenantId");

-- CreateIndex
CREATE INDEX "legal_proofs_timestamp_idx" ON "legal_proofs"("timestamp");

-- CreateIndex
CREATE INDEX "legal_proofs_isValid_idx" ON "legal_proofs"("isValid");

-- CreateIndex
CREATE INDEX "legal_proofs_createdAt_idx" ON "legal_proofs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscriptions_userId_key" ON "billing_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscriptions_stripeCustomerId_key" ON "billing_subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscriptions_stripeSubscriptionId_key" ON "billing_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "billing_subscriptions_userId_idx" ON "billing_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "billing_subscriptions_plan_idx" ON "billing_subscriptions"("plan");

-- CreateIndex
CREATE INDEX "billing_subscriptions_status_idx" ON "billing_subscriptions"("status");

-- CreateIndex
CREATE INDEX "billing_subscriptions_stripeCustomerId_idx" ON "billing_subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_stripePaymentIntentId_key" ON "billing_payments"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_stripeInvoiceId_key" ON "billing_payments"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "billing_payments_subscriptionId_idx" ON "billing_payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "billing_payments_status_idx" ON "billing_payments"("status");

-- CreateIndex
CREATE INDEX "billing_payments_stripePaymentIntentId_idx" ON "billing_payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "billing_payments_createdAt_idx" ON "billing_payments"("createdAt");

-- AddForeignKey
ALTER TABLE "github_event_logs" ADD CONSTRAINT "github_event_logs_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_event_logs" ADD CONSTRAINT "github_event_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_event_logs" ADD CONSTRAINT "github_event_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_proofs" ADD CONSTRAINT "legal_proofs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_proofs" ADD CONSTRAINT "legal_proofs_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_proofs" ADD CONSTRAINT "legal_proofs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_proofs" ADD CONSTRAINT "legal_proofs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
