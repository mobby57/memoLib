-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cabinetAddress" TEXT,
ADD COLUMN     "cabinetEmail" TEXT,
ADD COLUMN     "cabinetLogo" TEXT,
ADD COLUMN     "cabinetName" TEXT,
ADD COLUMN     "cabinetPhone" TEXT,
ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
ADD COLUMN     "deadlineNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'fr',
ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxFilesPerUpload" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxUploadSizeMb" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "ocrEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AIDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "blockchainHash" TEXT,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "origin" TEXT NOT NULL DEFAULT 'manual',
    "sourceRef" TEXT,
    "clientEmailEnc" TEXT,
    "clientEmailHash" TEXT,
    "encryptedData" TEXT,
    "requiredFields" JSONB,
    "requiredDocuments" JSONB,
    "providedDocuments" JSONB,
    "uploadedFiles" JSONB,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIDecision_tenantId_idx" ON "AIDecision"("tenantId");

-- CreateIndex
CREATE INDEX "AIDecision_entityId_idx" ON "AIDecision"("entityId");

-- CreateIndex
CREATE INDEX "AIDecision_createdAt_idx" ON "AIDecision"("createdAt");

-- CreateIndex
CREATE INDEX "IntakeRequest_tenantId_status_idx" ON "IntakeRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "IntakeRequest_clientEmailHash_idx" ON "IntakeRequest"("clientEmailHash");

-- CreateIndex
CREATE INDEX "IntakeRequest_status_idx" ON "IntakeRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeRequest_tenantId_origin_sourceRef_key" ON "IntakeRequest"("tenantId", "origin", "sourceRef");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_tenantId_idx" ON "UserPreference"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key_key" ON "UserPreference"("userId", "key");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

