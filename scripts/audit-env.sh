#!/bin/bash
set -e

# Charger .env.local proprement
if [ -f .env.local ]; then
    echo "📂 Chargement de .env.local"
    set -a
    source .env.local
    set +a
else
    echo "⚠️  Fichier .env.local introuvable"
fi

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Audit de l'environnement MemoLib${NC}"
echo "----------------------------------------"

# 1. Vérifier les variables
echo -e "\n${YELLOW}1. Variables d'environnement${NC}"
MISSING_VARS=()

check_var() {
    if [ -z "${!1}" ]; then
        echo -e "   ${RED}❌ $1 non définie${NC}"
        MISSING_VARS+=("$1")
    else
        echo -e "   ${GREEN}✅ $1 = ${!1}${NC}"
    fi
}

check_var "DATABASE_URL"
check_var "NEXTAUTH_SECRET"
check_var "NEXTAUTH_URL"

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "\n${RED}❌ Variables manquantes : ${MISSING_VARS[*]}${NC}"
    exit 1
else
    echo -e "\n${GREEN}✅ Toutes les variables sont présentes${NC}"
fi

# 2. Tester la base de données
echo -e "\n${YELLOW}2. Connexion à la base de données${NC}"
if npx prisma db execute --url "$DATABASE_URL" --stdin <<< "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ Connexion réussie${NC}"
else
    echo -e "${RED}❌ Échec de la connexion${NC}"
    echo "   Vérifiez que PostgreSQL est démarré"
fi

# 3. Test de compilation
echo -e "\n${YELLOW}3. Compilation TypeScript${NC}"
if npx tsc --noEmit &> /dev/null; then
    echo -e "${GREEN}✅ TypeScript OK${NC}"
else
    echo -e "${RED}❌ Erreurs TypeScript${NC}"
    exit 1
fi

echo -e "\n${BLUE}✅ Audit terminé.${NC}"
