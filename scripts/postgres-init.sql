-- ============================================
-- 🐘 POSTGRESQL INITIALIZATION SCRIPT
-- Configuration avancée pour IA Poste Manager
-- ============================================

-- Extensions PostgreSQL utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Génération UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Fonctions cryptographiques
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Recherche full-text
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- Index GIN performants
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Statistiques queries

-- ============================================
-- 🔐 CRÉATION RÔLES & PERMISSIONS
-- ============================================

-- Rôle lecture seule (pour analytics/backup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'memolib_readonly') THEN
    CREATE ROLE memolib_readonly WITH LOGIN PASSWORD 'readonly_pass_change_me';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE iapostemanage TO memolib_readonly;
GRANT USAGE ON SCHEMA public TO memolib_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO memolib_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO memolib_readonly;

-- Rôle application (avec write)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'memolib_app') THEN
    CREATE ROLE memolib_app WITH LOGIN PASSWORD 'app_pass_change_me';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE iapostemanage TO memolib_app;
GRANT USAGE, CREATE ON SCHEMA public TO memolib_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO memolib_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO memolib_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO memolib_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO memolib_app;

-- ============================================
-- 📊 FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour soft delete automatique
CREATE OR REPLACE FUNCTION set_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer des numéros de dossier
CREATE OR REPLACE FUNCTION generate_dossier_number(tenant_id TEXT)
RETURNS TEXT AS $$
DECLARE
  year INT;
  sequence_num INT;
  result TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero FROM '[0-9]+$') AS INT)
  ), 0) + 1
  INTO sequence_num
  FROM "Dossier"
  WHERE "tenantId" = tenant_id
    AND numero LIKE 'D-' || year || '-%';
  
  result := 'D-' || year || '-' || LPAD(sequence_num::TEXT, 3, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le score de risque d'un dossier
CREATE OR REPLACE FUNCTION calculate_risk_score(
  dossier_id TEXT
) RETURNS INT AS $$
DECLARE
  score INT := 0;
  deadline_days INT;
  documents_count INT;
  temps_ecoule INT;
BEGIN
  -- Récupérer le dossier
  SELECT 
    EXTRACT(DAY FROM ("dateEcheance" - NOW())) as days,
    (SELECT COUNT(*) FROM "Document" WHERE "dossierId" = dossier_id) as docs,
    EXTRACT(DAY FROM (NOW() - "dateCreation")) as elapsed
  INTO deadline_days, documents_count, temps_ecoule
  FROM "Dossier"
  WHERE id = dossier_id;
  
  -- Délai critique
  IF deadline_days < 7 THEN
    score := score + 50;
  ELSIF deadline_days < 30 THEN
    score := score + 30;
  END IF;
  
  -- Manque de documents
  IF documents_count < 3 THEN
    score := score + 20;
  END IF;
  
  -- Dossier ancien sans progrès
  IF temps_ecoule > 90 THEN
    score := score + 30;
  END IF;
  
  RETURN LEAST(score, 100); -- Max 100
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 🔍 VUES MATÉRIALISÉES (PERFORMANCE)
-- ============================================

-- Vue des statistiques par tenant
CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_stats AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT d.id) as total_dossiers,
  COUNT(DISTINCT d.id) FILTER (WHERE d.statut = 'en_cours') as dossiers_actifs,
  COUNT(DISTINCT d.id) FILTER (WHERE d.priorite = 'critique') as dossiers_critiques,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT f.id) as total_factures,
  COALESCE(SUM(f.montant) FILTER (WHERE f.statut = 'payee'), 0) as ca_total,
  COALESCE(SUM(f.montant) FILTER (WHERE f.statut = 'en_attente'), 0) as ca_attente,
  NOW() as last_updated
FROM "Tenant" t
LEFT JOIN "Dossier" d ON t.id = d."tenantId"
LEFT JOIN "Client" c ON t.id = c."tenantId"
LEFT JOIN "Facture" f ON t.id = f."tenantId"
GROUP BY t.id, t.name;

CREATE UNIQUE INDEX ON tenant_stats (tenant_id);

-- Vue des dossiers à risque
CREATE MATERIALIZED VIEW IF NOT EXISTS dossiers_at_risk AS
SELECT 
  d.id,
  d.numero,
  d."tenantId",
  d."clientId",
  d.statut,
  d.priorite,
  d."dateEcheance",
  d."typeDossier",
  EXTRACT(DAY FROM (d."dateEcheance" - NOW())) as jours_restants,
  (SELECT COUNT(*) FROM "Document" WHERE "dossierId" = d.id) as nb_documents,
  calculate_risk_score(d.id) as risk_score,
  NOW() as last_updated
FROM "Dossier" d
WHERE d."dateEcheance" IS NOT NULL
  AND d."dateEcheance" > NOW()
  AND d.statut IN ('en_cours', 'urgent')
ORDER BY calculate_risk_score(d.id) DESC;

CREATE INDEX ON dossiers_at_risk (risk_score DESC);
CREATE INDEX ON dossiers_at_risk ("tenantId");

-- ============================================
-- 🔄 JOBS AUTOMATIQUES (pg_cron si installé)
-- ============================================

-- Rafraîchir les vues matérialisées toutes les heures
-- (Nécessite l'extension pg_cron)
-- SELECT cron.schedule('refresh-tenant-stats', '0 * * * *', 
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_stats'
-- );
-- SELECT cron.schedule('refresh-dossiers-risk', '*/30 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY dossiers_at_risk'
-- );

-- ============================================
-- 📝 NOTIFICATIONS
-- ============================================

-- Notification pour nouveaux dossiers critiques
CREATE OR REPLACE FUNCTION notify_critical_dossier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.priorite = 'critique' THEN
    PERFORM pg_notify(
      'critical_dossier',
      json_build_object(
        'dossier_id', NEW.id,
        'tenant_id', NEW."tenantId",
        'numero', NEW.numero,
        'type', NEW."typeDossier"
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 🎯 CONFIGURATION FINALE
-- ============================================

-- Analyser les tables pour optimiser le planner
ANALYZE;

-- Afficher les extensions installées
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'btree_gin', 'pg_stat_statements')
ORDER BY extname;

-- Message de fin
DO $$
BEGIN
  RAISE NOTICE '✅ PostgreSQL initialized successfully for IA Poste Manager';
  RAISE NOTICE '📊 Materialized views created: tenant_stats, dossiers_at_risk';
  RAISE NOTICE '🔧 Custom functions available: generate_dossier_number, calculate_risk_score';
  RAISE NOTICE '🔐 Roles created: memolib_readonly, memolib_app';
END
$$;
