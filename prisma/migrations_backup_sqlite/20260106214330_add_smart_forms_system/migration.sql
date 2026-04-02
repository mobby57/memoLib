/*
  Warnings:

  - You are about to drop the column `aiSuggestedAction` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `aiSummary` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `archived` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `attachmentCount` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `attachmentsData` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `autoReplyContent` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `autoReplySent` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `autoReplySentAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `classificationType` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `gmailId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `hasAttachments` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `spam` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Email` table. All the data in the column will be lost.
  - Added the required column `messageId` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedDate` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Made the column `to` on table `Email` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "EmailClassification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "tags" TEXT,
    "suggestedAction" TEXT,
    "actionTaken" TEXT,
    "actionTakenBy" TEXT,
    "actionTakenAt" DATETIME,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "correctedType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailClassification_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "receivedDate" DATETIME NOT NULL,
    "tenantId" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "attachments" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "needsResponse" BOOLEAN NOT NULL DEFAULT false,
    "responseGenerated" BOOLEAN NOT NULL DEFAULT false,
    "responseDraft" TEXT,
    "trackingNumbers" TEXT,
    "extractedDates" TEXT,
    "extractedPhones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Email_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Email_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Email_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Email" ("bodyHtml", "bodyText", "clientId", "createdAt", "dossierId", "from", "id", "subject", "tenantId", "threadId", "to", "updatedAt") SELECT "bodyHtml", "bodyText", "clientId", "createdAt", "dossierId", "from", "id", "subject", "tenantId", "threadId", "to", "updatedAt" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");
CREATE INDEX "Email_tenantId_idx" ON "Email"("tenantId");
CREATE INDEX "Email_clientId_idx" ON "Email"("clientId");
CREATE INDEX "Email_dossierId_idx" ON "Email"("dossierId");
CREATE INDEX "Email_receivedDate_idx" ON "Email"("receivedDate");
CREATE INDEX "Email_isRead_idx" ON "Email"("isRead");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EmailClassification_emailId_key" ON "EmailClassification"("emailId");

-- CreateIndex
CREATE INDEX "EmailClassification_type_idx" ON "EmailClassification"("type");

-- CreateIndex
CREATE INDEX "EmailClassification_priority_idx" ON "EmailClassification"("priority");

-- CreateIndex
CREATE INDEX "EmailClassification_confidence_idx" ON "EmailClassification"("confidence");

-- CreateIndex
CREATE INDEX "EmailClassification_validated_idx" ON "EmailClassification"("validated");
