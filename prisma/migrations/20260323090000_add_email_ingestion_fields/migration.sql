ALTER TABLE "Email"
ADD COLUMN "sourceChannel" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN "sourceProvider" TEXT,
ADD COLUMN "sourceDirection" TEXT NOT NULL DEFAULT 'inbound',
ADD COLUMN "providerMessageId" TEXT,
ADD COLUMN "threadId" TEXT,
ADD COLUMN "internetMessageId" TEXT,
ADD COLUMN "fromAddress" TEXT,
ADD COLUMN "toAddresses" TEXT,
ADD COLUMN "cc" TEXT,
ADD COLUMN "bcc" TEXT,
ADD COLUMN "replyTo" TEXT,
ADD COLUMN "inReplyTo" TEXT,
ADD COLUMN "referenceIds" TEXT,
ADD COLUMN "bodyText" TEXT,
ADD COLUMN "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rawFormat" TEXT,
ADD COLUMN "rawPayload" TEXT,
ADD COLUMN "rawHeaders" TEXT,
ADD COLUMN "rawContent" TEXT,
ADD COLUMN "normalizedPayload" TEXT,
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "receivedDate" TIMESTAMP(3);

ALTER TABLE "EmailAttachment"
ADD COLUMN "contentId" TEXT,
ADD COLUMN "disposition" TEXT,
ADD COLUMN "checksum" TEXT,
ADD COLUMN "metadata" TEXT;

UPDATE "Email"
SET "bodyText" = "body"
WHERE "bodyText" IS NULL;

UPDATE "Email"
SET "receivedDate" = "receivedAt"
WHERE "receivedDate" IS NULL;

UPDATE "Email"
SET "hasAttachments" = EXISTS (
  SELECT 1
  FROM "EmailAttachment"
  WHERE "EmailAttachment"."emailId" = "Email"."id"
);

CREATE INDEX "Email_tenantId_receivedDate_idx" ON "Email"("tenantId", "receivedDate");
CREATE INDEX "Email_tenantId_sourceProvider_idx" ON "Email"("tenantId", "sourceProvider");
CREATE INDEX "Email_tenantId_threadId_idx" ON "Email"("tenantId", "threadId");
CREATE INDEX "Email_tenantId_fromAddress_idx" ON "Email"("tenantId", "fromAddress");
CREATE INDEX "Email_contentHash_idx" ON "Email"("contentHash");
