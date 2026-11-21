-- 1. Vérifier si le RLS est en mode FORCE sur les tables sensibles
\echo '=== 1. ETAT DU RLS (FORCE) ==='
SELECT relname, relrowsecurity AS rls_active, relforcerowsecurity AS rls_force
FROM pg_class 
WHERE relname IN ('LegalDeadline', 'Email', 'Client', 'UserConsent');

-- 2. Préparer les données de test (Tenant A)
\echo '=== 2. INSERTION DES FIXTURES ==='
INSERT INTO "Plan" (id, name, "displayName", "priceMonthly", "priceYearly", "updatedAt")
VALUES ('p-cron', 'cron', 'Cron', 0, 0, NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Tenant" (id, name, subdomain, "planId", "updatedAt")
VALUES ('t-cron', 'Cron', 'cron', 'p-cron', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Client" (id, "tenantId", email, "firstName", "lastName", "updatedAt")
VALUES ('c-cron', 't-cron', 'c@x.invalid', 'C', 'C', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "Dossier" (id, "tenantId", "clientId", numero, objet, "typeDossier", statut, "updatedAt")
VALUES ('d-cron', 't-cron', 'c-cron', 'DOS-TEST', 'Test', 'OQTF', 'en_cours', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "LegalDeadline" (id, "tenantId", "dossierId", "clientId", type, label, "referenceDate", "dueDate", "createdBy", "updatedAt")
VALUES ('dl-cron', 't-cron', 'd-cron', 'c-cron', (SELECT unnest(enum_range(NULL::"DeadlineType")) LIMIT 1), 'Test', NOW(), NOW() + INTERVAL '1 day', 'u-1', NOW()) ON CONFLICT DO NOTHING;

-- 3. Test SANS contexte (Simulation du CRON job avec prisma brut)
\echo '=== 3. TEST SANS CONTEXTE (Prisma Brut) ==='
SELECT 'SANS contexte' AS ctx, count(*) AS visible FROM "LegalDeadline";

-- 4. Test AVEC contexte (Simulation de withTenantContext)
\echo '=== 4. TEST AVEC CONTEXTE (withTenantContext) ==='
BEGIN;
SELECT set_config('app.current_tenant', 't-cron', true);
SELECT 'AVEC contexte' AS ctx, count(*) AS visible FROM "LegalDeadline";
COMMIT;

-- 5. Nettoyage
\echo '=== 5. NETTOYAGE ==='
DELETE FROM "LegalDeadline" WHERE id='dl-cron';
DELETE FROM "Dossier" WHERE id='d-cron';
DELETE FROM "Client" WHERE id='c-cron';
DELETE FROM "Tenant" WHERE id='t-cron';
DELETE FROM "Plan" WHERE id='p-cron';