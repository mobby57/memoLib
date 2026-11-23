-- The backfill must see every tenant, or fail instead of silently omitting rows.
BEGIN;
SET LOCAL row_security = off;
LOCK TABLE public."Invitation", public."AccessGrant" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE public."_InvitationTenantLookup" (
  "invitationId" TEXT PRIMARY KEY REFERENCES public."Invitation"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "tenantId" TEXT NOT NULL
);

CREATE TABLE public."_ClientDossierTenantLookup" (
  "grantId" TEXT PRIMARY KEY REFERENCES public."AccessGrant"("id") ON DELETE CASCADE,
  "clientUserId" TEXT NOT NULL,
  "dossierId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL
);

CREATE INDEX "_ClientDossierTenantLookup_client_dossier_idx"
  ON public."_ClientDossierTenantLookup" ("clientUserId", "dossierId");

REVOKE ALL ON public."_InvitationTenantLookup" FROM PUBLIC;
REVOKE ALL ON public."_ClientDossierTenantLookup" FROM PUBLIC;

INSERT INTO public."_InvitationTenantLookup" ("invitationId", "tokenHash", "tenantId")
SELECT "id", "tokenHash", "tenantId" FROM public."Invitation";

INSERT INTO public."_ClientDossierTenantLookup" ("grantId", "clientUserId", "dossierId", "tenantId")
SELECT "id", "clientUserId", "dossierId", "tenantId" FROM public."AccessGrant";

CREATE FUNCTION public.memolib_sync_invitation_tenant_lookup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public."_InvitationTenantLookup" ("invitationId", "tokenHash", "tenantId")
  VALUES (NEW."id", NEW."tokenHash", NEW."tenantId")
  ON CONFLICT ("invitationId") DO UPDATE
    SET "tokenHash" = EXCLUDED."tokenHash", "tenantId" = EXCLUDED."tenantId";
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.memolib_sync_client_dossier_tenant_lookup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public."_ClientDossierTenantLookup" ("grantId", "clientUserId", "dossierId", "tenantId")
  VALUES (NEW."id", NEW."clientUserId", NEW."dossierId", NEW."tenantId")
  ON CONFLICT ("grantId") DO UPDATE
    SET "clientUserId" = EXCLUDED."clientUserId",
        "dossierId" = EXCLUDED."dossierId",
        "tenantId" = EXCLUDED."tenantId";
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.memolib_sync_invitation_tenant_lookup() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.memolib_sync_client_dossier_tenant_lookup() FROM PUBLIC;

CREATE TRIGGER memolib_invitation_tenant_lookup
AFTER INSERT OR UPDATE OF "tokenHash", "tenantId" ON public."Invitation"
FOR EACH ROW EXECUTE FUNCTION public.memolib_sync_invitation_tenant_lookup();

CREATE TRIGGER memolib_client_dossier_tenant_lookup
AFTER INSERT OR UPDATE OF "clientUserId", "dossierId", "tenantId" ON public."AccessGrant"
FOR EACH ROW EXECUTE FUNCTION public.memolib_sync_client_dossier_tenant_lookup();

CREATE FUNCTION public.memolib_invitation_tenant(token_hash TEXT)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT "tenantId" FROM public."_InvitationTenantLookup" WHERE "tokenHash" = token_hash;
$$;

CREATE FUNCTION public.memolib_client_dossier_tenant(client_user_id TEXT, dossier_id TEXT)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT "tenantId"
  FROM public."_ClientDossierTenantLookup"
  WHERE "clientUserId" = client_user_id AND "dossierId" = dossier_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.memolib_invitation_tenant(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.memolib_client_dossier_tenant(TEXT, TEXT) FROM PUBLIC;
COMMIT;
