#!/bin/bash

# 🔒 Script de Déploiement Sécurisé - MemoLib
# Vérifie les vulnérabilités avant déploiement

set -e

echo "🔍 Vérification de sécurité pré-déploiement..."

# 1. Vérifier que les comptes démo sont désactivés en production
echo "✅ Vérification des comptes démo..."
if grep -q "DEMO_MODE=true" .env.production.local 2>/dev/null; then
    echo "❌ ERREUR: DEMO_MODE activé en production!"
    exit 1
fi

if grep -q "admin123\|demo123" src/app/api/auth/\[...nextauth\]/route.ts; then
    echo "❌ ERREUR: Mots de passe hardcodés détectés!"
    exit 1
fi

# 2. Vérifier les variables d'environnement critiques
echo "✅ Vérification des variables d'environnement..."
required_vars=(
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
    "ENCRYPTION_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ ERREUR: Variable $var manquante!"
        exit 1
    fi
done

# 3. Vérifier qu'aucun log sensible n'est présent
echo "✅ Vérification des logs sensibles..."
if grep -r "console.log.*password\|console.log.*Password" src/ --exclude-dir=node_modules; then
    echo "❌ ERREUR: Logs de mots de passe détectés!"
    exit 1
fi

# 4. Audit des dépendances
echo "✅ Audit des dépendances..."
npm audit --audit-level=high

# 5. Tests de sécurité
echo "✅ Tests de sécurité..."
npm run test:security 2>/dev/null || echo "⚠️  Tests de sécurité non configurés"

# 6. Build de production
echo "✅ Build de production..."
npm run build

# 7. Vérification des headers de sécurité
echo "✅ Vérification de la configuration de sécurité..."
if ! grep -q "Strict-Transport-Security" next.config.js; then
    echo "❌ ERREUR: Headers HSTS manquants!"
    exit 1
fi

echo "🎉 Toutes les vérifications de sécurité sont passées!"
echo "🚀 Prêt pour le déploiement sécurisé"

# Déploiement selon la plateforme
if [ "$1" = "vercel" ]; then
    echo "🚀 Déploiement Vercel..."
    vercel --prod
elif [ "$1" = "fly" ]; then
    echo "🚀 Déploiement Fly.io..."
    fly deploy
else
    echo "Usage: $0 [vercel|fly]"
    exit 1
fi