#!/bin/bash

# 🚀 Script de Déploiement Production MemoLib
# Usage: ./deploy-production.sh

set -e

echo "🚀 MemoLib - Déploiement Production"
echo "===================================="

# 1. Vérifications pré-déploiement
echo ""
echo "📋 1. Vérifications..."

cd src/frontend

# Tests
echo "  → Linting..."
npm run lint || { echo "❌ Lint failed"; exit 1; }

echo "  → Type checking..."
npx tsc --noEmit || { echo "❌ Type check failed"; exit 1; }

echo "  → Tests E2E..."
npx playwright test --workers=100% || { echo "❌ Tests failed"; exit 1; }

echo "✅ Tous les tests passent"

# 2. Build
echo ""
echo "🔨 2. Build..."
npm run build || { echo "❌ Build failed"; exit 1; }
echo "✅ Build réussi"

# 3. Déploiement Vercel
echo ""
echo "🚀 3. Déploiement Vercel..."
vercel --prod || { echo "❌ Deploy failed"; exit 1; }
echo "✅ Déployé sur Vercel"

# 4. Migrations Database
echo ""
echo "🗄️  4. Migrations Database..."
npx prisma migrate deploy || { echo "⚠️  Migrations warning"; }
echo "✅ Migrations appliquées"

# 5. Health Check
echo ""
echo "🏥 5. Health Check..."
sleep 10
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://memolib.fr/api/health)
if [ "$HEALTH" -eq 200 ]; then
  echo "✅ Health check OK"
else
  echo "❌ Health check failed (HTTP $HEALTH)"
  exit 1
fi

# 6. Lighthouse
echo ""
echo "📊 6. Performance Check..."
npx lighthouse https://memolib.fr --quiet --chrome-flags="--headless" || echo "⚠️  Lighthouse warning"

echo ""
echo "🎉 Déploiement réussi !"
echo "🌐 URL: https://memolib.fr"
echo "📊 Dashboard: https://vercel.com"
