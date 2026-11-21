ALTER TABLE "UserConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserConsent" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "UserConsent";
CREATE POLICY tenant_isolation_policy ON "UserConsent"
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "UserConsent"."userId"
        AND u."tenantId" = NULLIF(current_setting('app.current_tenant'::text, true), ''::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "UserConsent"."userId"
        AND u."tenantId" = NULLIF(current_setting('app.current_tenant'::text, true), ''::text)
    )
  );