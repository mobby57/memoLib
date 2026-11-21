[CmdletBinding()]
param(
    [string]$ContainerName = 'memolib-audit-pg16',
    [string]$NetworkName = 'memolib-audit-net',
    [switch]$ConfirmDisposableAudit
)

$ErrorActionPreference = 'Stop'
$databaseName = 'memolib_audit'
$databaseUser = 'memolib_audit'

if (-not $ConfirmDisposableAudit) {
    throw 'Refus : ajoutez -ConfirmDisposableAudit seulement pour la base jetable memolib_audit.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI est requis.'
}

$containerJson = & docker inspect $ContainerName 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Inspection du conteneur impossible : $($containerJson -join "`n")"
}
$container = (($containerJson -join "`n") | ConvertFrom-Json)[0]
if (-not $container.State.Running -or $container.Config.Image -ne 'postgres:16-alpine') {
    throw 'Cible refusee : conteneur arrete ou image differente de postgres:16-alpine.'
}
foreach ($requiredEnv in @(
    "POSTGRES_USER=$databaseUser",
    "POSTGRES_DB=$databaseName",
    'POSTGRES_HOST_AUTH_METHOD=trust'
)) {
    if ($container.Config.Env -notcontains $requiredEnv) {
        throw "Cible refusee : configuration jetable attendue absente ($requiredEnv)."
    }
}
if (@($container.HostConfig.Tmpfs.PSObject.Properties.Name) -notcontains '/var/lib/postgresql/data') {
    throw 'Cible refusee : le repertoire de donnees PostgreSQL ne repose pas sur tmpfs.'
}
if (@($container.Mounts | Where-Object {
    $_.Destination -eq '/var/lib/postgresql/data' -and $_.Type -ne 'tmpfs'
}).Count -gt 0) {
    throw 'Cible refusee : un stockage persistant est monte sur les donnees PostgreSQL.'
}

$networkJson = & docker network inspect $NetworkName 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Inspection du reseau impossible : $($networkJson -join "`n")"
}
$network = (($networkJson -join "`n") | ConvertFrom-Json)[0]
if (-not $network.Internal) {
    throw "Cible refusee : le reseau $NetworkName n'est pas interne."
}
$containerNetworks = @($container.NetworkSettings.Networks.PSObject.Properties.Name)
if ($containerNetworks.Count -ne 1 -or $containerNetworks[0] -ne $NetworkName) {
    throw "Cible refusee : le conteneur doit etre connecte exclusivement a $NetworkName. Reseaux trouves : $($containerNetworks -join ', ')."
}

$ready = & docker exec $ContainerName pg_isready -U $databaseUser -d $databaseName 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL ne repond pas : $($ready -join "`n")"
}
Write-Host "[PASS] Conteneur, image, stockage tmpfs, reseau interne et PostgreSQL verifies."

$token = [guid]::NewGuid().ToString('N').Substring(0, 10)
$sql = @'
\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'Client', 'Dossier', 'Email', 'Document', 'LegalDeadline', 'Facture',
    'AuditLog', 'Ecriture', 'CompteComptable', 'Journal',
    'MouvementBancaire', 'DeclarationTVA', 'MouvementCARPA',
    'Invitation', 'AccessGrant', 'LigneEcriture', 'UserConsent'
  ];
  table_name TEXT;
  table_oid OID;
  existing_rows BIGINT;
BEGIN
  IF current_database() <> 'memolib_audit'
     OR current_user <> 'memolib_audit'
     OR NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user)
     OR pg_is_in_recovery() THEN
    RAISE EXCEPTION 'Database identity or privileges do not match the disposable audit target';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'memolib_rls_matrix_test') THEN
    RAISE EXCEPTION 'Test role already exists; refusing to reuse it';
  END IF;

  FOREACH table_name IN ARRAY expected_tables LOOP
    table_oid := to_regclass(format('%I.%I', 'public', table_name));
    IF table_oid IS NULL THEN
      RAISE EXCEPTION 'Expected table public.% is missing', table_name;
    END IF;
    IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid = table_oid) THEN
      RAISE EXCEPTION 'RLS is not enabled and forced for public.%', table_name;
    END IF;
    IF (SELECT count(*) FROM pg_policy WHERE polrelid = table_oid) <> 1
       OR NOT EXISTS (
         SELECT 1 FROM pg_policy
         WHERE polrelid = table_oid AND polname = 'tenant_isolation_policy'
           AND polpermissive AND polcmd = '*'
       ) THEN
      RAISE EXCEPTION 'Expected exactly one permissive tenant_isolation_policy on public.%', table_name;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I', table_name) INTO existing_rows;
    IF existing_rows <> 0 THEN
      RAISE EXCEPTION 'public.% is not empty; refusing to add test fixtures', table_name;
    END IF;
  END LOOP;
END $$;

CREATE ROLE memolib_rls_matrix_test NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO memolib_rls_matrix_test;
GRANT SELECT ("id", "tenantId") ON public."User" TO memolib_rls_matrix_test;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "Client", "Dossier", "Email", "Document", "LegalDeadline", "Facture",
  "AuditLog", "Ecriture", "CompteComptable", "Journal",
  "MouvementBancaire", "DeclarationTVA", "MouvementCARPA",
  "Invitation", "AccessGrant", "LigneEcriture", "UserConsent"
TO memolib_rls_matrix_test;

CREATE TEMP TABLE rls_temp_namespace_anchor (id INTEGER) ON COMMIT DROP;

CREATE FUNCTION pg_temp.rls_fixture_insert_sql(p_table TEXT, p_tenant TEXT, p_suffix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $fn$
DECLARE
  c RECORD;
  names TEXT := '';
  values_sql TEXT := '';
  value_sql TEXT;
  fixture_id TEXT := 'rls-__TOKEN__-' || p_table || '-' || p_suffix;
  tenant_suffix TEXT;
  base_value TEXT;
  uuid_value TEXT;
BEGIN
  IF p_tenant = 'rls-__TOKEN__-a' THEN
    tenant_suffix := 'a';
  ELSIF p_tenant = 'rls-__TOKEN__-b' THEN
    tenant_suffix := 'b';
  ELSE
    RAISE EXCEPTION 'Unknown fixture tenant';
  END IF;

  FOR c IN
    SELECT a.attname, a.atttypid, a.atttypmod, t.typname, t.typcategory,
           d.adbin IS NOT NULL AS has_default
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = format('%I.%I', 'public', p_table)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attnotnull AND a.attidentity = '' AND a.attgenerated = ''
      AND d.adbin IS NULL
    ORDER BY a.attnum
  LOOP
    IF c.attname = 'id' THEN
      value_sql := quote_literal(fixture_id);
    ELSIF c.attname = 'tenantId' THEN
      value_sql := quote_literal(p_tenant);
    ELSIF c.attname = 'clientId' THEN
      value_sql := quote_literal('rls-__TOKEN__-Client-' || tenant_suffix);
    ELSIF c.attname = 'dossierId' THEN
      value_sql := quote_literal('rls-__TOKEN__-Dossier-' || tenant_suffix);
    ELSIF c.attname IN ('uploadedBy', 'lawyerId', 'clientUserId')
       OR (p_table = 'UserConsent' AND c.attname = 'userId') THEN
      value_sql := quote_literal('rls-__TOKEN__-User-' || tenant_suffix);
    ELSIF c.attname = 'journalId' THEN
      value_sql := quote_literal('rls-__TOKEN__-Journal-' || tenant_suffix);
    ELSIF c.attname = 'compteId' THEN
      value_sql := quote_literal('rls-__TOKEN__-CompteComptable-' || tenant_suffix);
    ELSIF c.attname = 'ecritureId' THEN
      value_sql := quote_literal('rls-__TOKEN__-Ecriture-' || tenant_suffix);
    ELSIF c.attname = 'invitationId' THEN
      IF p_suffix = 'x' THEN
        value_sql := quote_literal('rls-__TOKEN__-Invitation-extra-' || tenant_suffix);
      ELSE
        value_sql := quote_literal('rls-__TOKEN__-Invitation-' || tenant_suffix);
      END IF;
    ELSIF c.typcategory = 'E' THEN
      SELECT quote_literal(e.enumlabel) || '::' || format_type(c.atttypid, NULL)
        INTO value_sql
      FROM pg_enum e
      WHERE e.enumtypid = c.atttypid
      ORDER BY e.enumsortorder
      LIMIT 1;
    ELSIF c.typname IN ('text', 'varchar', 'bpchar', 'name', 'citext') THEN
      base_value := 'rls-__TOKEN__-' || p_table || '-' || c.attname || '-' || p_suffix;
      IF c.typname IN ('varchar', 'bpchar') AND c.atttypmod > 4 THEN
        base_value := left(base_value, c.atttypmod - 4);
      END IF;
      IF c.attname ILIKE '%email%' THEN
        base_value := left(base_value, 40) || '-' || p_suffix || '@example.invalid';
      END IF;
      value_sql := quote_literal(base_value);
    ELSIF c.typname = 'bool' THEN
      value_sql := 'false';
    ELSIF c.typname IN ('int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'money') THEN
      value_sql := '1';
    ELSIF c.typname IN ('timestamp', 'timestamptz', 'date', 'time', 'timetz') THEN
      value_sql := quote_literal('2026-01-01 12:00:00');
    ELSIF c.typname = 'uuid' THEN
      uuid_value := md5(fixture_id || c.attname);
      value_sql := quote_literal(
        substr(uuid_value, 1, 8) || '-' || substr(uuid_value, 9, 4) || '-' ||
        substr(uuid_value, 13, 4) || '-' || substr(uuid_value, 17, 4) || '-' ||
        substr(uuid_value, 21, 12)
      ) || '::uuid';
    ELSIF c.typname IN ('json', 'jsonb') THEN
      value_sql := quote_literal('{}') || '::' || c.typname;
    ELSIF c.typname = 'bytea' THEN
      value_sql := quote_literal('\x') || '::bytea';
    ELSE
      RAISE EXCEPTION 'No safe fixture value rule for public.%.% type %',
        p_table, c.attname, format_type(c.atttypid, c.atttypmod);
    END IF;

    names := names || CASE WHEN names = '' THEN '' ELSE ', ' END || format('%I', c.attname);
    values_sql := values_sql || CASE WHEN values_sql = '' THEN '' ELSE ', ' END || value_sql;
  END LOOP;

  IF names = '' THEN
    RAISE EXCEPTION 'No required columns found for public.%', p_table;
  END IF;
  RETURN format('INSERT INTO public.%I (%s) VALUES (%s)', p_table, names, values_sql);
END
$fn$;

INSERT INTO public."Plan"
  ("id", "name", "displayName", "priceMonthly", "priceYearly", "updatedAt")
VALUES ('rls-__TOKEN__-plan', 'rls-__TOKEN__-plan', 'RLS test', 0, 0, now());

INSERT INTO public."Tenant" ("id", "name", "subdomain", "planId", "updatedAt")
VALUES
  ('rls-__TOKEN__-a', 'RLS test A', 'rls-__TOKEN__-a', 'rls-__TOKEN__-plan', now()),
  ('rls-__TOKEN__-b', 'RLS test B', 'rls-__TOKEN__-b', 'rls-__TOKEN__-plan', now());

INSERT INTO public."User" ("id", "tenantId", "email", "name", "password", "role", "updatedAt")
VALUES
  ('rls-__TOKEN__-User-a', 'rls-__TOKEN__-a', 'rls-__TOKEN__-a@example.invalid', 'RLS test A', 'not-a-login', 'AVOCAT', now()),
  ('rls-__TOKEN__-User-b', 'rls-__TOKEN__-b', 'rls-__TOKEN__-b@example.invalid', 'RLS test B', 'not-a-login', 'AVOCAT', now());

DO $$
DECLARE
  table_name TEXT;
  suffix TEXT;
  tenant_id TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'Client', 'Dossier', 'Email', 'Document', 'LegalDeadline', 'Facture',
    'AuditLog', 'CompteComptable', 'Journal', 'Ecriture',
    'MouvementBancaire', 'DeclarationTVA', 'MouvementCARPA',
    'Invitation', 'AccessGrant', 'LigneEcriture', 'UserConsent'
  ] LOOP
    FOREACH suffix IN ARRAY ARRAY['a', 'b'] LOOP
      tenant_id := 'rls-__TOKEN__-' || suffix;
      EXECUTE pg_temp.rls_fixture_insert_sql(table_name, tenant_id, suffix);
    END LOOP;
  END LOOP;

  FOREACH suffix IN ARRAY ARRAY['a', 'b'] LOOP
    tenant_id := 'rls-__TOKEN__-' || suffix;
    EXECUTE pg_temp.rls_fixture_insert_sql('Invitation', tenant_id, 'extra-' || suffix);
  END LOOP;
END $$;

SET LOCAL ROLE memolib_rls_matrix_test;
DO $$
DECLARE
  table_name TEXT;
  own_id TEXT;
  other_id TEXT;
  own_tenant TEXT;
  other_tenant TEXT;
  row_count BIGINT;
  blocked BOOLEAN;
  error_message TEXT;
BEGIN
  IF current_user <> 'memolib_rls_matrix_test'
     OR (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user)
     OR EXISTS (
       SELECT 1 FROM pg_class c
       WHERE c.oid = ANY (ARRAY[
         '"Client"'::regclass, '"Dossier"'::regclass, '"Email"'::regclass,
         '"Document"'::regclass, '"LegalDeadline"'::regclass, '"Facture"'::regclass,
         '"AuditLog"'::regclass, '"Ecriture"'::regclass, '"CompteComptable"'::regclass,
         '"Journal"'::regclass, '"MouvementBancaire"'::regclass, '"DeclarationTVA"'::regclass,
         '"MouvementCARPA"'::regclass, '"Invitation"'::regclass, '"AccessGrant"'::regclass,
         '"LigneEcriture"'::regclass, '"UserConsent"'::regclass
       ]) AND pg_get_userbyid(c.relowner) = current_user
     ) THEN
    RAISE EXCEPTION 'Runtime test role is privileged or owns a tested table';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'Client', 'Dossier', 'Email', 'Document', 'LegalDeadline', 'Facture',
    'AuditLog', 'Ecriture', 'CompteComptable', 'Journal',
    'MouvementBancaire', 'DeclarationTVA', 'MouvementCARPA',
    'Invitation', 'AccessGrant', 'LigneEcriture', 'UserConsent'
  ] LOOP
    PERFORM set_config('app.current_tenant', '', true);
    EXECUTE format('SELECT count(*) FROM public.%I', table_name) INTO row_count;
    IF row_count <> 0 THEN
      RAISE EXCEPTION 'Rows visible in public.% without tenant context', table_name;
    END IF;

    own_id := 'rls-__TOKEN__-' || table_name || '-a';
    other_id := 'rls-__TOKEN__-' || table_name || '-b';
    own_tenant := 'rls-__TOKEN__-a';
    other_tenant := 'rls-__TOKEN__-b';

    -- Prove the same insert payload is valid under each matching tenant.
    -- Roll each successful insert back in its subtransaction.
    PERFORM set_config('app.current_tenant', own_tenant, true);
    BEGIN
      EXECUTE pg_temp.rls_fixture_insert_sql(table_name, own_tenant, 'x');
      RAISE SQLSTATE 'PZ001' USING MESSAGE = 'rollback successful insert';
    EXCEPTION WHEN SQLSTATE 'PZ001' THEN NULL;
    END;
    PERFORM set_config('app.current_tenant', other_tenant, true);
    BEGIN
      EXECUTE pg_temp.rls_fixture_insert_sql(table_name, other_tenant, 'x');
      RAISE SQLSTATE 'PZ001' USING MESSAGE = 'rollback successful insert';
    EXCEPTION WHEN SQLSTATE 'PZ001' THEN NULL;
    END;

    PERFORM set_config('app.current_tenant', '', true);
    blocked := false;
    BEGIN
      EXECUTE pg_temp.rls_fixture_insert_sql(table_name, own_tenant, 'x');
    EXCEPTION WHEN insufficient_privilege THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      IF position('row-level security policy' IN error_message) = 0 THEN
        RAISE;
      END IF;
      blocked := true;
    END;
    IF NOT blocked THEN
      RAISE EXCEPTION 'Insert without tenant context was accepted by public.%', table_name;
    END IF;

    PERFORM set_config('app.current_tenant', own_tenant, true);
    EXECUTE format('SELECT count(*) FROM public.%I WHERE id = $1', table_name)
      INTO row_count USING own_id;
    IF row_count <> 1 THEN
      RAISE EXCEPTION 'Tenant A cannot read its row in public.%', table_name;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE id = $1', table_name)
      INTO row_count USING other_id;
    IF row_count <> 0 THEN
      RAISE EXCEPTION 'Tenant A can read tenant B row in public.%', table_name;
    END IF;

    EXECUTE format('UPDATE public.%I SET id = id WHERE id = $1', table_name)
      USING own_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    IF row_count <> 1 THEN
      RAISE EXCEPTION 'Tenant A cannot update its row in public.%', table_name;
    END IF;

    EXECUTE format('UPDATE public.%I SET id = id WHERE id = $1', table_name)
      USING other_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    IF row_count <> 0 THEN
      RAISE EXCEPTION 'Tenant A updated tenant B row in public.%', table_name;
    END IF;

    EXECUTE format('DELETE FROM public.%I WHERE id = $1', table_name)
      USING other_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    IF row_count <> 0 THEN
      RAISE EXCEPTION 'Tenant A deleted tenant B row in public.%', table_name;
    END IF;

    blocked := false;
    BEGIN
      EXECUTE pg_temp.rls_fixture_insert_sql(table_name, other_tenant, 'x');
    EXCEPTION WHEN insufficient_privilege THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      IF position('row-level security policy' IN error_message) = 0 THEN
        RAISE;
      END IF;
      blocked := true;
    END;
    IF NOT blocked THEN
      RAISE EXCEPTION 'Cross-tenant insert was accepted by public.%', table_name;
    END IF;

    IF table_name = 'UserConsent' THEN
      blocked := false;
      BEGIN
        UPDATE public."UserConsent"
        SET "userId" = 'rls-__TOKEN__-User-b'
        WHERE id = own_id;
      EXCEPTION WHEN insufficient_privilege THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        IF position('row-level security policy' IN error_message) = 0 THEN
          RAISE;
        END IF;
        blocked := true;
      END;
      IF NOT blocked THEN
        RAISE EXCEPTION 'UserConsent reassignment to another tenant was accepted';
      END IF;
    ELSIF table_name = 'LigneEcriture' THEN
      blocked := false;
      BEGIN
        UPDATE public."LigneEcriture"
        SET "ecritureId" = 'rls-__TOKEN__-Ecriture-b'
        WHERE id = own_id;
      EXCEPTION WHEN insufficient_privilege THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        IF position('row-level security policy' IN error_message) = 0 THEN
          RAISE;
        END IF;
        blocked := true;
      END;
      IF NOT blocked THEN
        RAISE EXCEPTION 'LigneEcriture reassignment to another tenant was accepted';
      END IF;
    ELSE
      blocked := false;
      BEGIN
        EXECUTE format('UPDATE public.%I SET "tenantId" = $1 WHERE id = $2', table_name)
          USING other_tenant, own_id;
      EXCEPTION WHEN insufficient_privilege THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        IF position('row-level security policy' IN error_message) = 0 THEN
          RAISE;
        END IF;
        blocked := true;
      END;
      IF NOT blocked THEN
        RAISE EXCEPTION 'Tenant reassignment was accepted by public.%', table_name;
      END IF;
    END IF;

    PERFORM set_config('app.current_tenant', other_tenant, true);
    EXECUTE format('SELECT count(*) FROM public.%I WHERE id = $1', table_name)
      INTO row_count USING other_id;
    IF row_count <> 1 THEN
      RAISE EXCEPTION 'Tenant B cannot read its row in public.%', table_name;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE id = $1', table_name)
      INTO row_count USING own_id;
    IF row_count <> 0 THEN
      RAISE EXCEPTION 'Tenant B can read tenant A row in public.%', table_name;
    END IF;
    RAISE NOTICE 'RLS behavior PASS: public.%', table_name;
  END LOOP;
END $$;

ROLLBACK;
'@

$sql = $sql.Replace('__TOKEN__', $token)
$previousEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $psqlOutput = $sql | & docker exec -i $ContainerName psql -X -v ON_ERROR_STOP=1 `
        -U $databaseUser -d $databaseName -f - 2>&1
    $psqlExit = $LASTEXITCODE
    $psqlOutput | ForEach-Object { Write-Host $_ }
}
finally {
    $ErrorActionPreference = $previousEAP
}
if ($psqlExit -ne 0) {
    throw "RLS matrix failed. psql exit code: $psqlExit. The open transaction is rolled back when the connection closes."
}

Write-Host '[PASS] Tous les tests ont passe ; fixtures et role temporaire annules par ROLLBACK.'
