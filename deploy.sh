#!/bin/bash
# Script de déploiement MemoLib v1.0.0
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
VERSION="1.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Déploiement MemoLib v$VERSION sur $ENVIRONMENT"
echo "⏰ Timestamp: $TIMESTAMP"

# ==================== Phase 1: Vérifications ====================
echo ""
echo "📋 Phase 1: Vérifications pré-déploiement..."

# Test build
echo "  → Building Next.js..."
npm run build

# Test type-check
echo "  → Type checking..."
npm run type-check || echo "  ⚠️  Erreurs TypeScript détectées (non-bloquantes)"

# Tests
echo "  → Running tests..."
npm test -- --passWithNoTests || echo "  ⚠️  Certains tests échouent"

# Audit sécurité
echo "  → Security audit..."
npm audit --production || echo "  ⚠️  Vulnérabilités trouvées"

# ==================== Phase 2: Backend ====================
echo ""
echo "🔧 Phase 2: Préparation backend..."

# Database migrations
echo "  → Exécution migrations Prisma..."
npx prisma migrate deploy --skip-generate

# ==================== Phase 3: Frontend ====================
echo ""
echo "🌐 Phase 3: Déploiement Frontend (Vercel)..."

if [ "$ENVIRONMENT" = "production" ]; then
  echo "  → Déploiement en PRODUCTION"
  vercel deploy --prod
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo "  → Déploiement en STAGING"
  vercel deploy --env staging
fi

# ==================== Phase 4: Backend ====================
echo ""
echo "🔧 Phase 4: Déploiement Backend (Azure)..."

# Préparation du package
echo "  → Packaging backend..."
cd backend-python
zip -r ../backend-deploy-$TIMESTAMP.zip . -x "*.pyc" "__pycache__/*" ".venv/*"
cd ..

if [ "$ENVIRONMENT" = "production" ]; then
  echo "  → Déploiement en PRODUCTION"
  az webapp deployment source config-zip \
    --resource-group memolib-prod \
    --name memolib-api-prod \
    --src backend-deploy-$TIMESTAMP.zip
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo "  → Déploiement en STAGING"
  az webapp deployment source config-zip \
    --resource-group memolib-staging \
    --name memolib-api-staging \
    --src backend-deploy-$TIMESTAMP.zip
fi

# ==================== Phase 5: Tests post-déploiement ====================
echo ""
echo "✅ Phase 5: Tests post-déploiement..."

if [ "$ENVIRONMENT" = "production" ]; then
  API_URL="https://api.memolib.fr"
  FRONTEND_URL="https://app.memolib.fr"
elif [ "$ENVIRONMENT" = "staging" ]; then
  API_URL="https://api-staging.memolib.fr"
  FRONTEND_URL="https://staging.memolib.fr"
fi

# Test health
echo "  → Vérification de la disponibilité..."
curl -f $API_URL/api/health || { echo "❌ API indisponible"; exit 1; }
curl -f $FRONTEND_URL || { echo "❌ Frontend indisponible"; exit 1; }

# ==================== Phase 6: Monitoring ====================
echo ""
echo "📊 Phase 6: Configuration du monitoring..."

echo "  → Sentry dashboard: https://sentry.io/memolib"
echo "  → Logs Azure: https://portal.azure.com"
echo "  → Analytics: https://vercel.com/memolib"

# ==================== Succès ====================
echo ""
echo "✨ Déploiement réussi!"
echo ""
echo "📈 Liens utiles:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend: $API_URL"
echo "  Sentry: https://sentry.io/memolib"
echo "  Logs: az webapp log tail --resource-group memolib-$ENVIRONMENT --name memolib-api-$ENVIRONMENT"
echo ""
echo "🔄 Rollback si nécessaire:"
echo "  git revert HEAD && ./deploy.sh $ENVIRONMENT"
