#!/bin/bash
set -e

echo "🔍 Vérification de la compatibilité Linux..."

# Vérifier si on est sur WSL
if grep -qi microsoft /proc/version 2>/dev/null; then
    echo "✓ WSL détecté"
    if [[ "$PWD" == /mnt/c/* ]]; then
        echo "⚠️  ATTENTION: Projet sur /mnt/c/ (système de fichiers Windows)"
        echo "   Cela peut causer des problèmes. Recommandation:"
        echo "   1. Copier le projet vers ~/iaPostemanage"
        echo "   2. Ou utiliser ./scripts/wsl-fix.sh"
    fi
fi

# Vérifier Node.js et npm
echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"

# Installer les dépendances
echo "📦 Installing dependencies..."
npm ci

# Générer le client Prisma
echo "🔧 Generating Prisma client..."
npx prisma generate

# Vérifier TypeScript
echo "🔍 Type checking..."
npm run type-check

# Build
echo "🏗️  Building application..."
npm run build

echo "✅ Compatibilité Linux vérifiée!"
