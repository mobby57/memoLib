\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
  IF current_database() <> 'memolib_demo_test' OR session_user <> 'memolib_demo' THEN
    RAISE EXCEPTION 'Refus : cette validation cible uniquement memolib_demo_test avec memolib_demo';
  END IF;
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) THEN
    RAISE EXCEPTION 'Le role de test doit pouvoir creer un role temporaire';
  END IF;
END
$$;

CREATE ROLE memolib_demo_rls_check NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO memolib_demo_rls_check;
GRANT SELECT, INSERT, UPDATE ON public."Invitation", public."AccessGrant" TO memolib_demo_rls_check;
GRANT EXECUTE ON FUNCTION public.memolib_invitation_tenant(TEXT) TO memolib_demo_rls_check;
GRANT EXECUTE ON FUNCTION public.memolib_client_dossier_tenant(TEXT, TEXT) TO memolib_demo_rls_check;

INSERT INTO public."Plan" ("id", "name", "displayName", "priceMonthly", "priceYearly", "updatedAt")
VALUES ('rls-test-plan', 'rls-test-plan', 'Test', 0, 0, now());
INSERT INTO public."Tenant" ("id", "name", "subdomain", "planId", "updatedAt")
VALUES ('rls-test-tenant-a', 'Test A', 'rls-test-a', 'rls-test-plan', now()),
       ('rls-test-tenant-b', 'Test B', 'rls-test-b', 'rls-test-plan', now());
INSERT INTO public."User" ("id", "email", "name", "password", "role", "tenantId", "updatedAt")
VALUES ('rls-test-lawyer-a', 'rls-lawyer-a@example.invalid', 'Test A', 'unused', 'AVOCAT', 'rls-test-tenant-a', now()),
       ('rls-test-lawyer-b', 'rls-lawyer-b@example.invalid', 'Test B', 'unused', 'AVOCAT', 'rls-test-tenant-b', now()),
       ('rls-test-user', 'rls-user@example.invalid', 'Test Client', 'unused', 'CLIENT', NULL, now()),
       ('rls-test-user-new', 'rls-user-new@example.invalid', 'Test Client', 'unused', 'CLIENT', NULL, now());
INSERT INTO public."Client" ("id", "tenantId", "firstName", "lastName", "email", "updatedAt")
VALUES ('rls-test-client-a', 'rls-test-tenant-a', 'Test', 'A', 'rls-client-a@example.invalid', now()),
       ('rls-test-client-b', 'rls-test-tenant-b', 'Test', 'B', 'rls-client-b@example.invalid', now());
INSERT INTO public."Dossier" ("id", "tenantId", "numero", "clientId", "typeDossier", "updatedAt")
VALUES ('rls-test-dossier-a', 'rls-test-tenant-a', 'A', 'rls-test-client-a', 'TEST', now()),
       ('rls-test-dossier-b', 'rls-test-tenant-b', 'B', 'rls-test-client-b', 'TEST', now());
INSERT INTO public."Invitation" ("id", "email", "tenantId", "dossierId", "lawyerId", "tokenHash", "expiresAt", "status", "updatedAt")
VALUES ('rls-test-invitation-a', 'rls-user@example.invalid', 'rls-test-tenant-a', 'rls-test-dossier-a', 'rls-test-lawyer-a', 'rls-test-hash-a', now() + interval '1 day', 'ACCEPTED', now()),
       ('rls-test-invitation-b', 'rls-user@example.invalid', 'rls-test-tenant-b', 'rls-test-dossier-b', 'rls-test-lawyer-b', 'rls-test-hash-b', now() + interval '1 day', 'ACCEPTED', now());
INSERT INTO public."AccessGrant" ("id", "tenantId", "invitationId", "clientUserId", "dossierId", "status", "updatedAt")
VALUES ('rls-test-grant-a', 'rls-test-tenant-a', 'rls-test-invitation-a', 'rls-test-user', 'rls-test-dossier-a', 'ACTIVE', now()),
       ('rls-test-grant-b', 'rls-test-tenant-b', 'rls-test-invitation-b', 'rls-test-user', 'rls-test-dossier-b', 'ACTIVE', now());

SET LOCAL ROLE memolib_demo_rls_check;

DO $$
BEGIN
  IF (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'Role de validation privilegie';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ('Invitation', 'AccessGrant')
      AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity
           OR pg_get_userbyid(c.relowner) = current_user)
  ) THEN
    RAISE EXCEPTION 'RLS ou propriete des tables invalide';
  END IF;
  IF has_table_privilege(current_user, 'public."_InvitationTenantLookup"', 'SELECT,INSERT,UPDATE,DELETE')
     OR has_table_privilege(current_user, 'public."_ClientDossierTenantLookup"', 'SELECT,INSERT,UPDATE,DELETE')
     OR has_function_privilege(current_user, 'public.memolib_sync_invitation_tenant_lookup()', 'EXECUTE')
     OR has_function_privilege(current_user, 'public.memolib_sync_client_dossier_tenant_lookup()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Les tables de correspondance sont directement accessibles';
  END IF;
  IF public.memolib_invitation_tenant('rls-test-hash-a') IS DISTINCT FROM 'rls-test-tenant-a'
     OR public.memolib_client_dossier_tenant('rls-test-user', 'rls-test-dossier-b') IS DISTINCT FROM 'rls-test-tenant-b'
     OR public.memolib_invitation_tenant('unknown') IS NOT NULL
     OR public.memolib_client_dossier_tenant('wrong-user', 'rls-test-dossier-a') IS NOT NULL THEN
    RAISE EXCEPTION 'Echec de la recherche de correspondance';
  END IF;
  IF EXISTS (SELECT 1 FROM public."Invitation" WHERE "id" LIKE 'rls-test-%')
     OR EXISTS (SELECT 1 FROM public."AccessGrant" WHERE "id" LIKE 'rls-test-%') THEN
    RAISE EXCEPTION 'Donnees visibles sans contexte tenant';
  END IF;
END
$$;

SELECT set_config('app.current_tenant', 'rls-test-tenant-a', true);

DO $$
BEGIN
  IF (SELECT count(*) FROM public."Invitation" WHERE "id" LIKE 'rls-test-%') <> 1
     OR (SELECT count(*) FROM public."AccessGrant" WHERE "id" LIKE 'rls-test-%') <> 1
     OR EXISTS (SELECT 1 FROM public."Invitation" WHERE "id" = 'rls-test-invitation-b')
     OR EXISTS (SELECT 1 FROM public."AccessGrant" WHERE "id" = 'rls-test-grant-b') THEN
    RAISE EXCEPTION 'Isolation inter-tenant invalide';
  END IF;
END
$$;

INSERT INTO public."Invitation" ("id", "email", "tenantId", "dossierId", "lawyerId", "tokenHash", "expiresAt", "status", "updatedAt")
VALUES ('rls-test-invitation-new', 'rls-user@example.invalid', 'rls-test-tenant-a', 'rls-test-dossier-a', 'rls-test-lawyer-a', 'rls-test-hash-new', now() + interval '1 day', 'ACCEPTED', now());
INSERT INTO public."AccessGrant" ("id", "tenantId", "invitationId", "clientUserId", "dossierId", "status", "updatedAt")
VALUES ('rls-test-grant-new', 'rls-test-tenant-a', 'rls-test-invitation-new', 'rls-test-user-new', 'rls-test-dossier-a', 'ACTIVE', now());

DO $$
BEGIN
  IF public.memolib_invitation_tenant('rls-test-hash-new') IS DISTINCT FROM 'rls-test-tenant-a' THEN
    RAISE EXCEPTION 'Echec de synchronisation de la nouvelle invitation';
  END IF;
  IF public.memolib_client_dossier_tenant('rls-test-user-new', 'rls-test-dossier-a') IS DISTINCT FROM 'rls-test-tenant-a' THEN
    RAISE EXCEPTION 'Echec de synchronisation du nouveau grant';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."AccessGrant" WHERE "id" = 'rls-test-grant-new') THEN
    RAISE EXCEPTION 'Echec de creation du grant sous RLS';
  END IF;
END
$$;

ROLLBACK;
SELECT 'PASS: RLS et fonctions de correspondance verifiees; donnees de test annulees' AS result;
