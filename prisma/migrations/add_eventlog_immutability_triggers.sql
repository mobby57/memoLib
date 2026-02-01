-- ============================================
-- MIGRATION: EventLog Immuabilité
-- ============================================
-- Implémentation RULE-004 (BUSINESS_RULES.md)
-- Garantit qu'aucun EventLog ne peut être modifié ou supprimé
-- ============================================

-- Fonction qui lève une exception
CREATE OR REPLACE FUNCTION prevent_eventlog_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'EventLog are immutable and cannot be modified or deleted (RULE-004)';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur UPDATE
CREATE TRIGGER prevent_eventlog_update
BEFORE UPDATE ON event_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_eventlog_modification();

-- Trigger sur DELETE
CREATE TRIGGER prevent_eventlog_delete
BEFORE DELETE ON event_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_eventlog_modification();

-- ============================================
-- VERIFICATION
-- ============================================
-- Test (à exécuter après migration) :
-- 
-- 1. Insérer un EventLog :
--    INSERT INTO event_logs (id, timestamp, event_type, entity_type, entity_id, actor_type, tenant_id, immutable, checksum, metadata)
--    VALUES ('test-id', NOW(), 'FLOW_RECEIVED', 'flow', 'test-flow', 'SYSTEM', 'test-tenant', true, 'test-checksum', '{}');
--
-- 2. Tenter UPDATE (devrait échouer) :
--    UPDATE event_logs SET event_type = 'FLOW_NORMALIZED' WHERE id = 'test-id';
--    => ERROR: EventLog are immutable...
--
-- 3. Tenter DELETE (devrait échouer) :
--    DELETE FROM event_logs WHERE id = 'test-id';
--    => ERROR: EventLog are immutable...
--
-- 4. Cleanup :
--    DROP TRIGGER prevent_eventlog_delete ON event_logs;
--    DROP TRIGGER prevent_eventlog_update ON event_logs;
--    DELETE FROM event_logs WHERE id = 'test-id';
--    CREATE TRIGGER prevent_eventlog_update BEFORE UPDATE ON event_logs FOR EACH ROW EXECUTE FUNCTION prevent_eventlog_modification();
--    CREATE TRIGGER prevent_eventlog_delete BEFORE DELETE ON event_logs FOR EACH ROW EXECUTE FUNCTION prevent_eventlog_modification();
-- ============================================
