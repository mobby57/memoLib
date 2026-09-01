#!/bin/bash
# switch-env.sh – Bascule entre les environnements (dev, preview, prod)
# Usage : ./switch-env.sh [dev|preview|prod]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction d'aide
usage() {
    echo -e "${BLUE}Usage: $0 {dev|preview|prod}${NC}"
    echo ""
    echo "  dev     – environnement de développement local"
    echo "  preview – environnement de prévisualisation (staging)"
    echo "  prod    – environnement de production"
    echo ""
    echo "Exemple: $0 preview"
    exit 1
}

# Vérifier l'argument
if [ $# -ne 1 ]; then
    usage
fi

ENV=$1

# Vérifier que l'environnement est valide
if [[ ! "$ENV" =~ ^(dev|preview|prod)$ ]]; then
    echo -e "${RED}❌ Environnement invalide : $ENV${NC}"
    usage
fi

echo -e "${BLUE}🔄 Bascule vers l'environnement : ${ENV^^}${NC}"
echo "----------------------------------------"

# 1. Gestion des fichiers .env
backup_env() {
    if [ -f .env.local ]; then
        cp .env.local .env.local.bak
        echo -e "${YELLOW}📂 Sauvegarde de .env.local -> .env.local.bak${NC}"
    fi
}

restore_env() {
    if [ -f .env.local.bak ]; then
        cp .env.local.bak .env.local
        echo -e "${YELLOW}📂 Restauration depuis .env.local.bak${NC}"
    fi
}

case $ENV in
    dev)
        backup_env
        # Utiliser .env.dev s'il existe, sinon créer un fichier minimal
        if [ -f .env.dev ]; then
            cp .env.dev .env.local
            echo -e "${GREEN}✅ Utilisation de .env.dev${NC}"
        else
            cat > .env.local << 'DEVEOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/memolib_dev
NEXTAUTH_SECRET=dev_secret_change_me
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
DEVEOF
            echo -e "${GREEN}✅ .env.local créé pour le développement${NC}"
        fi
        echo -e "${GREEN}🚀 Lancement en mode dev : npm run dev${NC}"
        npm run dev
        ;;

    preview)
        backup_env
        if [ -f .env.preview ]; then
            cp .env.preview .env.local
            echo -e "${GREEN}✅ Utilisation de .env.preview${NC}"
        else
            # Création automatique avec variables générées
            NEXTAUTH_SECRET=$(openssl rand -base64 32)
            cat > .env.local << 'PREVIEWEOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/memolib_preview
NEXTAUTH_SECRET=preview_secret_change_me
NEXTAUTH_URL=http://localhost:3001
NODE_ENV=preview
PREVIEWEOF
            sed -i "s/preview_secret_change_me/${NEXTAUTH_SECRET}/g" .env.local
            echo -e "${GREEN}✅ .env.local créé pour la preview${NC}"
        fi
        echo -e "${GREEN}🚀 Lancement en mode preview : npm run dev -- -p 3001${NC}"
        npm run dev -- -p 3001
        ;;

    prod)
        backup_env
        if [ -f .env.production ]; then
            cp .env.production .env.local
            echo -e "${GREEN}✅ Utilisation de .env.production${NC}"
        else
            echo -e "${RED}❌ Fichier .env.production manquant${NC}"
            echo "   Créez-le avec vos variables de production."
            restore_env
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Production : exécution de npm run build && npm start${NC}"
        npm run build
        npm start
        ;;
esac

# Restaurer .env.local original si on revient en dev
# (cela se fait automatiquement au prochain switch)
