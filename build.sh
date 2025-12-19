#!/bin/bash
# Script de build pour Render - Frontend + Backend unifié

set -e  # Arrêter en cas d'erreur

echo "🏗️ BUILD RENDER - FRONTEND + BACKEND"
echo "====================================="

# 1. Installer les dépendances backend
echo "📦 Installation dépendances backend..."
pip install -r requirements.txt

# 2. Installer Node.js si pas déjà disponible
if ! command -v npm &> /dev/null; then
    echo "📥 Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs || {
        echo "⚠️ Impossible d'installer Node.js automatiquement"
        echo "⚠️ Le frontend ne sera pas buildé - utilisation des fichiers statiques du repo"
        exit 0
    }
fi

# 3. Builder le frontend React
echo "📦 Build frontend React..."
cd src/frontend

echo "✅ npm version: $(npm --version)"
echo "✅ node version: $(node --version)"

# Installer les dépendances
echo "📥 Installation dépendances frontend..."
npm install || {
    echo "❌ Erreur lors de npm install"
    exit 1
}

# Builder pour production
echo "🔨 Build production..."
npm run build || {
    echo "❌ Erreur lors du build frontend"
    exit 1
}

if [ -d "dist" ]; then
    echo "✅ Frontend buildé avec succès"
    ls -la dist/
else
    echo "❌ Dossier dist non créé"
    exit 1
fi

# 4. Retourner au répertoire racine
cd ../..

echo "✅ Build terminé - Prêt pour déploiement"