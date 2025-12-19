#!/bin/bash
# Script de build pour Render - Frontend + Backend unifié

set -e  # Arrêter en cas d'erreur

echo "🏗️ BUILD RENDER - FRONTEND + BACKEND"
echo "====================================="

# 1. Installer les dépendances backend
echo "📦 Installation dépendances backend..."
pip install -r requirements.txt

# 2. Vérifier si le frontend est déjà buildé (committé dans le repo)
if [ -d "src/frontend/dist" ] && [ -f "src/frontend/dist/index.html" ]; then
    echo "✅ Frontend dist trouvé dans le repo Git"
    echo "📦 Utilisation du build pré-compilé"
    ls -la src/frontend/dist/
else
    echo "⚠️ Frontend dist non trouvé - tentative de build..."
    
    # Builder le frontend React si npm est disponible
    if command -v npm &> /dev/null; then
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
        
        cd ../..
    else
        echo "❌ npm non disponible et dist absent - le frontend ne fonctionnera pas"
        exit 1
    fi
fi

echo "✅ Build terminé - Prêt pour déploiement"