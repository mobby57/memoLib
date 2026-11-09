-- =====================================================================
-- ACTIVATION DU ROW LEVEL SECURITY (RLS) POUR MEMOLIB
-- Objectif : Empêcher les fuites inter-tenant (Cabinets A et B)
-- =====================================================================

-- 1. Création des rôles (si pas déjà fait)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_admin') THEN
        CREATE ROLE app_admin;
    END IF;
END
$$;

-- 2. Activation du RLS sur les tables critiques
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dossier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Email" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LegalDeadline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facture" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ecriture" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- 3. Création des politiques (Policies)
-- On utilise 'current_setting('app.current_tenant')' qui sera injecté par le middleware Prisma

-- Table Client
DROP POLICY IF EXISTS tenant_isolation_policy ON "Client";
CREATE POLICY tenant_isolation_policy ON "Client"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table Dossier
DROP POLICY IF EXISTS tenant_isolation_policy ON "Dossier";
CREATE POLICY tenant_isolation_policy ON "Dossier"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table Email (attention, elle a peut-être une clé étrangère vers Dossier/Tenant)
DROP POLICY IF EXISTS tenant_isolation_policy ON "Email";
CREATE POLICY tenant_isolation_policy ON "Email"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table Document
DROP POLICY IF EXISTS tenant_isolation_policy ON "Document";
CREATE POLICY tenant_isolation_policy ON "Document"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table LegalDeadline
DROP POLICY IF EXISTS tenant_isolation_policy ON "LegalDeadline";
CREATE POLICY tenant_isolation_policy ON "LegalDeadline"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table Facture
DROP POLICY IF EXISTS tenant_isolation_policy ON "Facture";
CREATE POLICY tenant_isolation_policy ON "Facture"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table Ecriture (Comptabilité)
DROP POLICY IF EXISTS tenant_isolation_policy ON "Ecriture";
CREATE POLICY tenant_isolation_policy ON "Ecriture"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- Table AuditLog
DROP POLICY IF EXISTS tenant_isolation_policy ON "AuditLog";
CREATE POLICY tenant_isolation_policy ON "AuditLog"
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant', true));

-- 4. Bypass pour les admins (Scripts de migration, SuperAdmin)
-- Le rôle app_admin ignore le RLS
ALTER TABLE "Client" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Dossier" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Email" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
ALTER TABLE "LegalDeadline" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Facture" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Ecriture" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

-- Politique de bypass pour le SuperAdmin (ou le compte de migration)
DROP POLICY IF EXISTS admin_bypass_policy ON "Client";
CREATE POLICY admin_bypass_policy ON "Client"
    FOR ALL
    TO app_admin
    USING (true);
-- (Répéter pour les autres tables si nécessaire)
