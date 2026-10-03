-- Identical content can legitimately be received by separate law firms.
-- Deduplication must remain tenant-scoped to preserve isolation.
DROP INDEX IF EXISTS "InformationUnit_contentHash_key";

CREATE UNIQUE INDEX IF NOT EXISTS "InformationUnit_tenantId_contentHash_key"
  ON "InformationUnit"("tenantId", "contentHash");
