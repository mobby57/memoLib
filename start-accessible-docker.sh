#!/bin/bash

echo "🚀 Démarrage SecureVault Accessible avec Docker"
echo "================================================"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé"
    exit 1
fi

# Créer dossiers nécessaires
mkdir -p data uploads logs

# Variables d'environnement
export SECRET_KEY=${SECRET_KEY:-"accessible-vault-$(date +%s)"}
export DISPLAY=${DISPLAY:-:0}

echo "🔧 Configuration:"
echo "   - Interface accessible: ACTIVÉE"
echo "   - Synthèse vocale: ACTIVÉE" 
echo "   - Reconnaissance vocale: ACTIVÉE"
echo "   - Port: 5000"
echo ""

# Option 1: App complète avec accessibilité intégrée
echo "🎯 Option 1: Application complète (recommandée)"
echo "   docker-compose up --build"
echo ""

# Option 2: Interface accessible dédiée
echo "🎯 Option 2: Interface accessible dédiée"
echo "   docker-compose -f docker-compose.accessible.yml up --build"
echo ""

# Demander choix utilisateur
read -p "Choisir option (1 ou 2): " choice

case $choice in
    1)
        echo "🚀 Démarrage application complète..."
        docker-compose up --build --watch
        ;;
    2)
        echo "🚀 Démarrage interface accessible dédiée..."
        docker-compose -f docker-compose.accessible.yml up --build
        ;;
    *)
        echo "🚀 Démarrage par défaut (option 1)..."
        docker-compose up --build
        ;;
esac

echo ""
echo "✅ Application accessible disponible sur:"
echo "   🌐 http://localhost:5000"
echo "   🎤 http://localhost:5000/accessible/"
echo ""
echo "🎯 Fonctionnalités accessibles:"
echo "   - Navigation vocale complète"
echo "   - Interface 3 boutons"
echo "   - Auto-ajustements utilisateur"
echo "   - Synthèse vocale intégrée"
echo "   - Reconnaissance vocale"
echo ""