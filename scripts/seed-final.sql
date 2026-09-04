-- ============================================================
-- seed-final.sql
-- Insère ou met à jour les données de test avec ON CONFLICT
-- ============================================================

-- 1. Plan
INSERT INTO "Plan" (id, name, "displayName", description, "priceMonthly", "priceYearly", currency,
  "maxWorkspaces", "maxDossiers", "maxClients", "maxStorageGb", "maxUsers",
  "aiAutonomyLevel", "humanValidation", "advancedAnalytics", "externalAiAccess",
  "prioritySupport", "customBranding", "apiAccess", "isActive", "createdAt", "updatedAt")
VALUES (
  'starter', 'Starter', 'Starter', 'Plan de base', 0, 0, 'EUR',
  1, 100, 20, 5, 5,
  1, true, false, false,
  false, false, false, true, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "displayName" = EXCLUDED."displayName",
  "updatedAt" = NOW();

-- 2. Tenant
INSERT INTO "Tenant" (id, name, subdomain, domain, "planId", status,
  "currentWorkspaces", "currentDossiers", "currentClients", "currentStorageGb", "currentUsers",
  "createdAt", "updatedAt")
SELECT
  gen_random_uuid(), 'Cabinet Test', 'test-cabinet', 'test-cabinet.local', 'starter', 'active',
  1, 0, 0, 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Tenant" WHERE subdomain = 'test-cabinet');

-- 3. Utilisateurs (ON CONFLICT sur email)
INSERT INTO "User" (id, email, name, password, role, "tenantId", status, language, timezone, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'admin@test.com', 'Admin Test', '$2a$12$...', 'ADMIN', (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'), 'active', 'fr', 'Europe/Paris', NOW(), NOW()),
  (gen_random_uuid(), 'avocat@test.com', 'Avocat Test', '$2a$12$1C26unvsJp5LdZp6XhA5L.lCuI2UJYLwvYuzYvBrBEJEHbBgqV/E.', 'USER', (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'), 'active', 'fr', 'Europe/Paris', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  "updatedAt" = NOW();

-- 4. Client
INSERT INTO "Client" (id, "tenantId", "firstName", "lastName", email, phone, address, pays, status, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(), (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  'Jean', 'Dupont', 'jean.dupont@example.com', '0612345678',
  '1 rue de la Justice, 75001 Paris', 'France', 'actif', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Client" 
  WHERE email = 'jean.dupont@example.com' 
    AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')
);

-- 5. Dossier
INSERT INTO "Dossier" (id, "tenantId", "clientId", numero, "typeDossier", statut, phase, objet, "responsableId", "dateCreation", "dateOuverture", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(), 
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  (SELECT id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  'D2026001', 'Contentieux', 'en_cours', 'instruction', 'Litige contractuel',
  (SELECT id FROM "User" WHERE email = 'avocat@test.com'),
  NOW(), NOW(), NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Dossier" 
  WHERE numero = 'D2026001' 
    AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')
);

-- 6. Délai légal
INSERT INTO "LegalDeadline" (id, "tenantId", "dossierId", "clientId", type, label, "referenceDate", "dueDate", status, "createdBy", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  (SELECT id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  'RECOURS_CONTENTIEUX', 'Délai d''appel', NOW(), NOW() + INTERVAL '30 days', 'PENDING',
  (SELECT id FROM "User" WHERE email = 'avocat@test.com'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "LegalDeadline" 
  WHERE label = 'Délai d''appel' 
    AND "dossierId" = (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'))
);

-- 7. Facture
INSERT INTO "Facture" (id, "tenantId", "clientId", "dossierId", numero, reference, description, "montantHT", "tauxTVA", "montantTVA", "montantTTC", statut, "dateEmission", "dateEcheance", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  (SELECT id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  'F' || EXTRACT(EPOCH FROM NOW())::text, 'REF-' || EXTRACT(EPOCH FROM NOW())::text,
  'Facture test', 1000, 20, 200, 1200, 'brouillon', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Facture" 
  WHERE numero LIKE 'F%' 
    AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')
);

-- 8. Ligne de facture
INSERT INTO "LigneFacture" (id, "factureId", description, quantite, "prixUnitaire", "montantHT", "createdAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Facture" WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet') ORDER BY "createdAt" DESC LIMIT 1),
  'Honoraires - Dossier test', 1, 1000, 1000, NOW()
WHERE EXISTS (SELECT 1 FROM "Facture" WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'));

-- 9. Email
INSERT INTO "Email" (id, "tenantId", "from", "to", subject, body, "receivedAt", "isProcessed", category, urgency, sentiment, "clientId", "dossierId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  'client@example.com', 'avocat@test.com', 'Demande d''information', 'Bonjour, je souhaite faire un point sur mon dossier.',
  NOW(), true, 'general-inquiry', 'medium', 'neutral',
  (SELECT id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Email" 
  WHERE subject = 'Demande d''information' 
    AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')
);

-- 10. Proposition IA (ActionProposal)
INSERT INTO "ActionProposal" (id, "tenantId", "emailId", "dossierId", type, status, priority, "riskLevel", rationale, "payloadJson", "proposedBy", "idempotencyKey", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  (SELECT id FROM "Email" WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet') ORDER BY "createdAt" DESC LIMIT 1),
  (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  'CREATE_LEGAL_DEADLINE', 'PENDING', 'MEDIUM', 'LOW',
  'Le client demande un point, il faut programmer un rendez-vous.', '{"suggestion":"planifier appel"}', 'system-ia', gen_random_uuid()::text, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM "Email" WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'));

-- 11. Document
INSERT INTO "Document" (id, "tenantId", "dossierId", "clientId", filename, "originalName", "mimeType", size, "storageKey", "uploadedBy", "ocrProcessed", "ocrText", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  (SELECT id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  'test.pdf', 'test.pdf', 'application/pdf', 1024, 'test-key',
  (SELECT id FROM "User" WHERE email = 'avocat@test.com'), true, 'Contenu OCR simulé.', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Document" 
  WHERE filename = 'test.pdf' 
    AND "dossierId" = (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'))
);

-- 12. Preuve (Proof)
INSERT INTO "Proof" (id, "tenantId", type, title, description, "dossierId", "clientId", "proofDate", "capturedBy", status, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  'DOCUMENT_RECEPTION', 'Accusé de réception', 'Preuve de réception du document test',
  (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  (SELECT id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')),
  NOW(),
  (SELECT id FROM "User" WHERE email = 'avocat@test.com'),
  'PENDING_VALIDATION', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Proof" 
  WHERE title = 'Accusé de réception' 
    AND "dossierId" = (SELECT id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'))
);

-- 13. Rapport (Report)
INSERT INTO "Report" (id, "tenantId", type, title, status, "generatedBy", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet'),
  'DOSSIER_SUMMARY', 'Rapport de test', 'PENDING',
  (SELECT id FROM "User" WHERE email = 'avocat@test.com'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Report" 
  WHERE title = 'Rapport de test' 
    AND "tenantId" = (SELECT id FROM "Tenant" WHERE subdomain = 'test-cabinet')
);
