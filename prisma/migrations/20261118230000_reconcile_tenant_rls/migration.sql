-- Reconcile RLS for environments that recorded the original RLS migration
-- before its policy expressions and accounting-table coverage were corrected.

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'Client',
    'Dossier',
    'Email',
    'Document',
    'LegalDeadline',
    'Facture',
    'AuditLog',
    'Ecriture',
    'CompteComptable',
    'Journal',
    'MouvementBancaire',
    'DeclarationTVA',
    'MouvementCARPA',
    'Invitation',
    'AccessGrant'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', table_name);
    EXECUTE format(
      $policy$
        CREATE POLICY tenant_isolation_policy ON %I
        FOR ALL TO PUBLIC
        USING (%I = NULLIF(current_setting('app.current_tenant', true), ''))
        WITH CHECK (%I = NULLIF(current_setting('app.current_tenant', true), ''))
      $policy$,
      table_name,
      'tenantId',
      'tenantId'
    );
  END LOOP;

  ALTER TABLE "LigneEcriture" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "LigneEcriture" FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_isolation_policy ON "LigneEcriture";
  CREATE POLICY tenant_isolation_policy ON "LigneEcriture"
    FOR ALL
    TO PUBLIC
    USING (
      EXISTS (
        SELECT 1
        FROM "Ecriture"
        WHERE "Ecriture"."id" = "LigneEcriture"."ecritureId"
          AND "Ecriture"."tenantId" = NULLIF(current_setting('app.current_tenant', true), '')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM "Ecriture"
        WHERE "Ecriture"."id" = "LigneEcriture"."ecritureId"
          AND "Ecriture"."tenantId" = NULLIF(current_setting('app.current_tenant', true), '')
      )
    );

END
$$;
