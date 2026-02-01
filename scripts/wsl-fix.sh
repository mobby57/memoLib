#!/bin/bash
# Script de fix rapide pour WSL
set -e

echo "🔧 Fix WSL - iaPostemanage"
echo ""

# Vérifier si on est sur /mnt/c (Windows filesystem)
if [[ "$PWD" == /mnt/c/* ]]; then
    echo "⚠️  ATTENTION: Vous êtes sur le système de fichiers Windows (/mnt/c/)"
    echo "   Cela peut causer des problèmes de permissions sur WSL."
    echo ""
    echo "📋 Options:"
    echo "   1. Continuer ici (peut avoir des problèmes de performance/permissions)"
    echo "   2. Copier le projet vers ~/iaPostemanage (recommandé)"
    echo ""
    read -p "Votre choix (1/2): " choice
    
    if [ "$choice" = "2" ]; then
        echo "📦 Copie du projet vers ~/ ..."
        mkdir -p ~/iaPostemanage
        rsync -av --exclude='node_modules' --exclude='.next' --exclude='prisma/dev.db' . ~/iaPostemanage/
        cd ~/iaPostemanage
        echo "✅ Projet copié dans ~/iaPostemanage"
        echo "   Exécutez: cd ~/iaPostemanage"
    fi
fi

echo ""
echo "🧹 Nettoyage des fichiers Windows..."
rm -rf node_modules .next out dist

echo ""
echo "📦 Installation des dépendances (peut prendre quelques minutes)..."
npm install

echo ""
echo "🔧 Génération du client Prisma..."
npx prisma generate

echo ""
echo "✅ Configuration WSL terminée!"
echo ""
echo "📝 Commandes disponibles:"
echo "   npm run dev          - Démarrer le serveur de développement"
echo "   npm run build        - Build de production"
echo "   npm run type-check   - Vérification TypeScript"
echo "   npx prisma studio    - Interface graphique DB"
echo ""
echo "⚡ Pour démarrer:"
echo "   npm run dev"
