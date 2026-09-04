#!/bin/bash

echo "🔧 Étape 1: Réinitialisation de la base et création des tables..."
npx prisma db push --force-reset

echo "📦 Étape 2: Insertion du plan 'starter'..."
npx prisma db execute --stdin << 'SQL'
INSERT INTO "Plan" (
  "id", "name", "displayName", "description", "priceMonthly", "priceYearly", "currency",
  "maxWorkspaces", "maxDossiers", "maxClients", "maxStorageGb", "maxUsers",
  "aiAutonomyLevel", "humanValidation", "advancedAnalytics", "externalAiAccess",
  "prioritySupport", "customBranding", "apiAccess", "isActive", "createdAt", "updatedAt"
) VALUES (
  'starter', 'Starter', 'Starter', 'Plan de base pour les tests', 0.0, 0.0, 'EUR',
  1, 100, 20, 5, 5,
  1, true, false, false,
  false, false, false, true, NOW(), NOW()
) ON CONFLICT ("id") DO NOTHING;
SQL

echo "🌱 Étape 3: Exécution du seed (tenant, utilisateurs, clients, dossiers)..."
npx tsx prisma/seed-e2e.ts
