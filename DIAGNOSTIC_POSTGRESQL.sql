-- ============================================
-- DIAGNOSTIC: Vérifier l'état réel de PostgreSQL
-- ============================================
-- À exécuter depuis psql ou Neon SQL Editor
-- Copier-coller chaque bloc et vérifier les résultats

-- ============================================
-- 1. VÉRIFIER LES COLONNES AccessGrant
-- ============================================

SELECT 
  'AccessGrant columns' as check_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'AccessGrant' 
ORDER BY ordinal_position;

-- Expected output (6 colonnes) :
-- id, invitationId, clientUserId, expiresAt, revokedAt, createdAt
-- If you see dossierId, status, updatedAt : migration has been applied ✅
-- If you DON'T see them : migration is NOT applied ❌

-- ============================================
-- 2. VÉRIFIER LES CLÉS ÉTRANGÈRES (FK)
-- ============================================

SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name
FROM information_schema.referential_constraints 
WHERE table_name = 'AccessGrant'
ORDER BY constraint_name;

-- Expected output: (empty)
-- If empty : NO FK exist ❌
-- If you see FK : migrations have been applied partially ⚠️

-- ============================================
-- 3. VÉRIFIER LE TYPE ENUM AccessGrantStatus
-- ============================================

SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'AccessGrantStatus'
GROUP BY t.typname;

-- Expected output: (empty row or no rows)
-- If empty : enum does NOT exist ❌
-- If you see (ACTIVE, REVOKED, EXPIRED) : enum exists ✅

-- ============================================
-- 4. VÉRIFIER LES INDICES (Indexes)
-- ============================================

SELECT 
  schemaname,
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'AccessGrant'
ORDER BY indexname;

-- Expected indexes:
-- AccessGrant_invitationId_key
-- AccessGrant_clientUserId_idx
-- (If you see AccessGrant_dossierId_idx or AccessGrant_expiresAt_idx: partial fix applied)

-- ============================================
-- 5. VÉRIFIER LES CONTRAINTES UNIQUE
-- ============================================

SELECT 
  constraint_name,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'AccessGrant'
AND constraint_type = 'UNIQUE'
ORDER BY constraint_name;

-- Expected:
-- AccessGrant_invitationId_key
-- (If you see AccessGrant_invitationId_clientUserId_key: partial fix applied)

-- ============================================
-- 6. VÉRIFIER QUE LES TABLES EXISTENT
-- ============================================

SELECT 
  'Table existence check' as check_type,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables
WHERE table_name IN ('AccessGrant', 'Invitation', 'Dossier', 'User')
ORDER BY table_name;

-- Expected output:
-- AccessGrant, Invitation, Dossier, User should all exist

-- ============================================
-- 7. VÉRIFIER LES DONNÉES EXISTANTES
-- ============================================

SELECT 
  'AccessGrant count' as table_name,
  COUNT(*) as row_count
FROM "AccessGrant"

UNION ALL

SELECT 
  'Invitation count' as table_name,
  COUNT(*) as row_count
FROM "Invitation"

UNION ALL

SELECT 
  'Dossier count' as table_name,
  COUNT(*) as row_count
FROM "Dossier"

UNION ALL

SELECT 
  'User count' as table_name,
  COUNT(*) as row_count
FROM "User";

-- Expected output:
-- Should show 0 rows for all (tables are empty - new feature)

-- ============================================
-- RÉSUMÉ DIAGNOSIS
-- ============================================

-- Run all above queries and compare with expected output

-- IF you see:
--   ✅ dossierId, status, updatedAt in AccessGrant
--   ✅ 3+ FK constraints
--   ✅ AccessGrantStatus enum exists
-- → Migration HAS BEEN APPLIED, schema is synchronized

-- IF you see:
--   ❌ NO dossierId, status, updatedAt in AccessGrant
--   ❌ 0 FK constraints
--   ❌ NO AccessGrantStatus enum
-- → Migration HAS NOT BEEN APPLIED, schema is NOT synchronized

-- ============================================
