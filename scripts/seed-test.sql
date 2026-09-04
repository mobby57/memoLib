-- seed-test.sql
-- Insertion du plan (si inexistant)
INSERT INTO "Plan" (id, name, "displayName", description, "priceMonthly", "priceYearly", currency,
  "maxWorkspaces", "maxDossiers", "maxClients", "maxStorageGb", "maxUsers",
  "aiAutonomyLevel", "humanValidation", "advancedAnalytics", "externalAiAccess",
  "prioritySupport", "customBranding", "apiAccess", "isActive", "createdAt", "updatedAt")
VALUES (
  'starter', 'Starter', 'Starter', 'Plan de base', 0, 0, 'EUR',
  1, 100, 20, 5, 5,
  1, true, false, false,
  false, false, false, true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertion du tenant (si inexistant)
INSERT INTO "Tenant" (id, name, subdomain, domain, "planId", status,
  "currentWorkspaces", "currentDossiers", "currentClients", "currentStorageGb", "currentUsers",
  "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(), 'Cabinet Test', 'test-cabinet', 'test-cabinet.local', 'starter', 'active',
  1, 0, 0, 0, 0, NOW(), NOW()
) ON CONFLICT (subdomain) DO NOTHING;

-- Récupérer l'ID du tenant
DO $$
DECLARE
  tenant_id UUID;
  admin_id UUID;
  avocat_id UUID;
  client_id UUID;
  dossier_id UUID;
  facture_id UUID;
BEGIN
  SELECT id INTO tenant_id FROM "Tenant" WHERE subdomain = 'test-cabinet';

  -- Insertion des utilisateurs
  INSERT INTO "User" (id, email, name, password, role, "tenantId", status, language, timezone, "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid(), 'admin@test.com', 'Admin Test', '$2a$12$...', 'ADMIN', tenant_id, 'active', 'fr', 'Europe/Paris', NOW(), NOW()),
    (gen_random_uuid(), 'avocat@test.com', 'Avocat Test', '$2a$12$1C26unvsJp5LdZp6XhA5L.lCuI2UJYLwvYuzYvBrBEJEHbBgqV/E.', 'USER', tenant_id, 'active', 'fr', 'Europe/Paris', NOW(), NOW())
  ON CONFLICT (email) DO NOTHING;

  -- Récupérer les IDs
  SELECT id INTO admin_id FROM "User" WHERE email = 'admin@test.com';
  SELECT id INTO avocat_id FROM "User" WHERE email = 'avocat@test.com';

  -- Insertion client
  INSERT INTO "Client" (id, "tenantId", "firstName", "lastName", email, phone, address, pays, status, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, 'Jean', 'Dupont', 'jean.dupont@example.com', '0612345678',
    '1 rue de la Justice, 75001 Paris', 'France', 'actif', NOW(), NOW()
  ) ON CONFLICT ("tenantId", email) DO NOTHING;

  SELECT id INTO client_id FROM "Client" WHERE email = 'jean.dupont@example.com' AND "tenantId" = tenant_id;

  -- Insertion dossier
  INSERT INTO "Dossier" (id, "tenantId", "clientId", numero, "typeDossier", statut, phase, objet, "responsableId", "dateCreation", "dateOuverture", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, client_id, 'D2026001', 'Contentieux', 'en_cours', 'instruction', 'Litige contractuel', avocat_id, NOW(), NOW(), NOW(), NOW()
  ) ON CONFLICT ("tenantId", numero) DO NOTHING;

  SELECT id INTO dossier_id FROM "Dossier" WHERE numero = 'D2026001' AND "tenantId" = tenant_id;

  -- Insertion délai
  INSERT INTO "LegalDeadline" (id, "tenantId", "dossierId", "clientId", type, label, "referenceDate", "dueDate", status, "createdBy", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, dossier_id, client_id, 'RECOURS_CONTENTIEUX', 'Délai d''appel', NOW(), NOW() + INTERVAL '30 days', 'PENDING', avocat_id, NOW(), NOW()
  ) ON CONFLICT ("tenantId", "dossierId", label) DO NOTHING;

  -- Insertion facture
  INSERT INTO "Facture" (id, "tenantId", "clientId", "dossierId", numero, reference, description, "montantHT", "tauxTVA", "montantTVA", "montantTTC", statut, "dateEmission", "dateEcheance", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, client_id, dossier_id, 'F' || EXTRACT(EPOCH FROM NOW())::text, 'REF-F' || EXTRACT(EPOCH FROM NOW())::text, 'Facture test', 1000, 20, 200, 1200, 'brouillon', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()
  ) ON CONFLICT ("tenantId", numero) DO NOTHING;

  SELECT id INTO facture_id FROM "Facture" WHERE numero LIKE 'F%' AND "tenantId" = tenant_id ORDER BY "createdAt" DESC LIMIT 1;

  -- Insertion ligne facture
  INSERT INTO "LigneFacture" (id, "factureId", description, quantite, "prixUnitaire", "montantHT", "createdAt")
  VALUES (
    gen_random_uuid(), facture_id, 'Honoraires - Dossier test', 1, 1000, 1000, NOW()
  ) ON CONFLICT DO NOTHING;

  -- Insertion email
  INSERT INTO "Email" (id, "tenantId", "from", "to", subject, body, "receivedAt", "isProcessed", category, urgency, sentiment, "clientId", "dossierId", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, 'client@example.com', 'avocat@test.com', 'Demande d''information', 'Bonjour, je souhaite faire un point sur mon dossier.', NOW(), true, 'general-inquiry', 'medium', 'neutral', client_id, dossier_id, NOW(), NOW()
  );

  -- Insertion proposition IA (action proposal)
  INSERT INTO "ActionProposal" (id, "tenantId", "emailId", "dossierId", type, status, priority, "riskLevel", rationale, "payloadJson", "proposedBy", "idempotencyKey", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, (SELECT id FROM "Email" ORDER BY "createdAt" DESC LIMIT 1), dossier_id, 'CREATE_LEGAL_DEADLINE', 'PENDING', 'MEDIUM', 'LOW',
    'Le client demande un point, il faut programmer un rendez-vous.', '{"suggestion":"planifier appel"}', 'system-ia', gen_random_uuid()::text, NOW(), NOW()
  );

  -- Insertion document
  INSERT INTO "Document" (id, "tenantId", "dossierId", "clientId", filename, "originalName", "mimeType", size, "storageKey", "uploadedBy", "ocrProcessed", "ocrText", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, dossier_id, client_id, 'test.pdf', 'test.pdf', 'application/pdf', 1024, 'test-key', avocat_id, true, 'Contenu OCR simulé.', NOW(), NOW()
  );

  -- Insertion preuve
  INSERT INTO "Proof" (id, "tenantId", type, title, description, "dossierId", "clientId", "proofDate", "capturedBy", status, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, 'DOCUMENT_RECEPTION', 'Accusé de réception', 'Preuve de réception du document test', dossier_id, client_id, NOW(), avocat_id, 'PENDING_VALIDATION', NOW(), NOW()
  );

  -- Insertion rapport
  INSERT INTO "Report" (id, "tenantId", type, title, status, "generatedBy", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), tenant_id, 'DOSSIER_SUMMARY', 'Rapport de test', 'PENDING', avocat_id, NOW(), NOW()
  );

  -- Afficher un résumé
  RAISE NOTICE '✅ Données créées pour le tenant %', tenant_id;
END $$;