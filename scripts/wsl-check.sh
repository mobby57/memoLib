#!/bin/bash
# Script de vérification rapide de l'environnement WSL

echo "🔍 Vérification de l'environnement WSL pour iaPostemanage"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de test
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

# Node.js
echo "📦 Dépendances système:"
node --version &> /dev/null
check "Node.js $(node --version 2>/dev/null)"

npm --version &> /dev/null
check "npm $(npm --version 2>/dev/null)"

# Prisma
if [ -x "node_modules/.bin/prisma" ]; then
    echo -e "${GREEN}✅ Prisma installé${NC}"
else
    echo -e "${RED}❌ Prisma non installé${NC}"
fi

# Next.js
if [ -x "node_modules/.bin/next" ]; then
    echo -e "${GREEN}✅ Next.js installé${NC}"
else
    echo -e "${RED}❌ Next.js non installé${NC}"
fi

echo ""
echo "📁 Système de fichiers:"
if [[ "$PWD" == /mnt/c/* ]]; then
    echo -e "${YELLOW}⚠️  Vous êtes sur le système de fichiers Windows (/mnt/c/)${NC}"
    echo "   Cela peut causer des problèmes de permissions."
    echo "   Recommandation: Déplacer vers ~/iaPostemanage"
else
    echo -e "${GREEN}✅ Système de fichiers WSL natif${NC}"
fi

echo ""
echo "🔐 Permissions:"
if [ -d "node_modules" ] && [ -w "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules accessible en écriture${NC}"
elif [ -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules existe mais pas d'accès en écriture${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules n'existe pas (npm install requis)${NC}"
fi

echo ""
echo "🐳 Docker (optionnel):"
if command -v docker &> /dev/null; then
    docker --version &> /dev/null
    check "Docker $(docker --version 2>/dev/null | cut -d ' ' -f3 | sed 's/,//')"
else
    echo -e "${YELLOW}⚠️  Docker non installé (optionnel)${NC}"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose disponible${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose non installé (optionnel)${NC}"
fi

echo ""
echo "📋 Prochaines étapes:"
if [ ! -d "node_modules" ]; then
    echo "   1. npm install"
    echo "   2. npx prisma generate"
    echo "   3. npm run dev"
elif [ ! -x "node_modules/.bin/next" ]; then
    echo "   1. rm -rf node_modules"
    echo "   2. npm install"
    echo "   3. npm run dev"
else
    echo "   npm run dev - Démarrer le serveur"
fi
