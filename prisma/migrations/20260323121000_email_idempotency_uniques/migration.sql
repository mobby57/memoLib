-- Convert global email idempotency keys to tenant-scoped unique indexes.

DROP INDEX IF EXISTS "Email_messageId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Email_tenantId_messageId_key"
ON "Email" ("tenantId", "messageId");

CREATE UNIQUE INDEX IF NOT EXISTS "Email_tenantId_providerMessageId_key"
ON "Email" ("tenantId", "providerMessageId");

CREATE UNIQUE INDEX IF NOT EXISTS "Email_tenantId_internetMessageId_key"
ON "Email" ("tenantId", "internetMessageId");

CREATE UNIQUE INDEX IF NOT EXISTS "Email_tenantId_contentHash_key"
ON "Email" ("tenantId", "contentHash");
