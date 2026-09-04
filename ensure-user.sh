#!/bin/bash
set -e

echo "🔍 Vérification de l'utilisateur avocat@test.com..."

# Générer le hash bcrypt pour Test123!@#456
HASH=$(node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('Test123!@#456', 10).then(h => console.log(h));
")

# 1. Créer le plan si absent
echo "📦 Création du plan starter..."
npx prisma db execute --stdin <<< "
INSERT INTO \"Plan\" (id, name, \"displayName\", description, \"priceMonthly\", \"priceYearly\", currency,
  \"maxWorkspaces\", \"maxDossiers\", \"maxClients\", \"maxStorageGb\", \"maxUsers\",
  \"aiAutonomyLevel\", \"humanValidation\", \"advancedAnalytics\", \"externalAiAccess\",
  \"prioritySupport\", \"customBranding\", \"apiAccess\", \"isActive\", \"createdAt\", \"updatedAt\")
VALUES (
  'starter', 'Starter', 'Starter', 'Plan de base', 0, 0, 'EUR',
  1, 100, 20, 5, 5,
  1, true, false, false,
  false, false, false, true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
"

# 2. Créer le tenant
echo "🏢 Création du tenant..."
npx prisma db execute --stdin <<< "
INSERT INTO \"Tenant\" (id, name, subdomain, \"planId\", \"createdAt\", \"updatedAt\")
VALUES ('tenant-e2e', 'Cabinet E2E', 'cabinet-e2e', 'starter', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
"

# 3. Créer l'utilisateur
echo "👤 Création de l'utilisateur avocat@test.com..."
npx prisma db execute --stdin <<< "
INSERT INTO \"User\" (id, email, password, name, role, \"tenantId\", \"emailVerified\", \"createdAt\", \"updatedAt\")
VALUES (
  'user-avocat',
  'avocat@test.com',
  '$HASH',
  'Avocat Test',
  'LAWYER',
  'tenant-e2e',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
"

echo "✅ Utilisateur assuré."
