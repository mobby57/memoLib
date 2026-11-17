-- ============================================
-- VÉRIFICATION POST-MIGRATION
-- File: CHECK_MIGRATION_POST_FIX_ACCESS_GRANT.sql
-- Purpose: Vérifier que la migration a bien appliqué tous les changements
-- ============================================

-- 1. VÉRIFIER LES COLONNES AccessGrant
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'AccessGrant' 
ORDER BY ordinal_position;

-- Expected output:
-- id            | text           | NO  | NULL
-- invitationId  | text           | NO  | NULL
-- clientUserId  | text           | NO  | NULL
-- dossierId     | TEXT           | NO  | NULL (← NEW)
-- status        | USER-DEFINED   | NO  | 'ACTIVE'::AccessGrantStatus (← NEW)
-- updatedAt     | timestamp      | NO  | CURRENT_TIMESTAMP (← NEW)
-- expiresAt     | timestamp      | NO  | NULL
-- revokedAt     | timestamp      | YES | NULL
-- createdAt     | timestamp      | NO  | CURRENT_TIMESTAMP

-- ============================================

-- 2. VÉRIFIER LES CLÉS ÉTRANGÈRES (Foreign Keys)
SELECT 
  constraint_name, 
  table_name, 
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints 
WHERE table_name IN ('AccessGrant', 'Invitation')
ORDER BY table_name, constraint_name;

-- Expected FK for AccessGrant:
-- AccessGrant_dossierId_fkey
-- AccessGrant_invitationId_fkey
-- AccessGrant_clientUserId_fkey

-- Expected FK for Invitation:
-- Invitation_dossierId_fkey
-- Invitation_lawyerId_fkey

-- ============================================

-- 3. VÉRIFIER LE TYPE ENUM AccessGrantStatus
SELECT 
  t.typname AS enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'AccessGrantStatus'
GROUP BY t.typname;

-- Expected output:
-- enum_name            | enum_values
-- AccessGrantStatus    | {ACTIVE,REVOKED,EXPIRED}

-- ============================================

-- 4. VÉRIFIER LES INDICES (Indexes)
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'AccessGrant'
ORDER BY indexname;

-- Expected indices:
-- AccessGrant_dossierId_idx
-- AccessGrant_expiresAt_idx
-- AccessGrant_clientUserId_idx
-- AccessGrant_invitationId_key (UNIQUE)
-- AccessGrant_invitationId_clientUserId_key (UNIQUE)

-- ============================================

-- 5. VÉRIFIER LES CONTRAINTES UNIQUE
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage 
WHERE table_name = 'AccessGrant'
AND constraint_name LIKE '%_key'
ORDER BY constraint_name;

-- Expected output:
-- AccessGrant_invitationId_key
-- AccessGrant_invitationId_clientUserId_key

-- ============================================

-- 6. TEST D'INTÉGRITÉ : Vérifier qu'aucune ligne n'existe
SELECT COUNT(*) as access_grant_count FROM "AccessGrant";
SELECT COUNT(*) as invitation_count FROM "Invitation";

-- Expected output: 0 (table vide puisque nouvelles)

-- ============================================

-- 7. VÉRIFIER QUE LES FK FONCTIONNENT (optionnel, si données existent)
-- Essayer d'insérer une ligne avec une dossierId invalide:
-- BEGIN;
-- INSERT INTO "AccessGrant" (id, invitationId, clientUserId, dossierId, expiresAt)
-- VALUES ('test', 'inv-1', 'user-1', 'invalid-dossier-id', NOW() + INTERVAL '7 days');
-- -- This should fail with: "violates foreign key constraint"
-- ROLLBACK;

-- ============================================

-- 8. VÉRIFIER LES RELATIONS PRISMA REFLÈTENT LE SCHÉMA
-- Note: Cela doit être fait dans prisma/schema.prisma
-- Les modèles AccessGrant, Invitation, Dossier et User doivent avoir les bonnes relations

-- Modèle Invitation doit avoir:
-- dossier Dossier @relation(fields: [dossierId], references: [id], onDelete: Cascade)
-- lawyer  User    @relation("InvitationsCreated", fields: [lawyerId], references: [id], onDelete: Restrict)

-- Modèle AccessGrant doit avoir:
-- invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
-- clientUser User       @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
-- dossier    Dossier    @relation(fields: [dossierId], references: [id], onDelete: Cascade)

-- Modèle Dossier doit avoir:
-- invitations  Invitation[]
-- accessGrants AccessGrant[]

-- Modèle User doit avoir:
-- invitationsCreated Invitation[]   @relation("InvitationsCreated")
-- clientAccess       AccessGrant[]  @relation("ClientAccess")

-- ============================================

-- 9. RÉSUMÉ D'INTÉGRITÉ
SELECT 
  'AccessGrant columns' as check_category,
  COUNT(*) as expected_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AccessGrant') as actual_count
UNION ALL
SELECT 
  'AccessGrant FK constraints' as check_category,
  3 as expected_count,
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE table_name = 'AccessGrant' AND constraint_type = 'FOREIGN KEY') as actual_count
UNION ALL
SELECT 
  'Invitation FK constraints' as check_category,
  2 as expected_count,
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE table_name = 'Invitation' AND constraint_type = 'FOREIGN KEY') as actual_count;

-- If all checks pass, you should see:
-- check_category               | expected_count | actual_count
-- AccessGrant columns          | 9              | 9
-- AccessGrant FK constraints   | 3              | 3
-- Invitation FK constraints    | 2              | 2
