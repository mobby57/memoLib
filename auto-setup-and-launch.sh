#!/bin/bash
# auto-setup-and-launch.sh
# Synchronise le schéma, peuple la base, vérifie les données, et lance l'application

set -e  # stop en cas d'erreur

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Lancement de l'installation automatique...${NC}"

# 1. Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL non définie. Chargez votre .env.${NC}"
    exit 1
fi

# 2. Synchroniser le schéma Prisma avec la base
echo -e "${YELLOW}📦 Synchronisation du schéma Prisma (prisma db push)...${NC}"
npx prisma db push

# 3. Exécuter le seed SQL (peuple les données de test)
echo -e "${YELLOW}🌱 Insertion des données de test...${NC}"
if [ -f "scripts/seed-final.sql" ]; then
    npx prisma db execute --file scripts/seed-final.sql
else
    echo -e "${RED}❌ Fichier scripts/seed-final.sql introuvable.${NC}"
    exit 1
fi

# 4. Vérifier que les tables critiques sont peuplées
echo -e "${YELLOW}🔍 Audit des tables critiques...${NC}"
TABLES=("Plan" "Tenant" "User" "Client" "Dossier" "Facture" "LigneFacture" "LegalDeadline" "Document" "Proof" "Email" "ActionProposal" "Report")
FOUND=0
for table in "${TABLES[@]}"; do
    COUNT=$(PGPASSWORD='npg_jH3oCNW4eAEI' psql -h ep-lucky-dust-b2vvw0a8-pooler.c-6.eu-central-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb -t -c "SELECT COUNT(*) FROM \"$table\";" | tr -d ' ')
    if [ "$COUNT" -gt 0 ]; then
        ((FOUND++))
        echo -e "   ${GREEN}✅${NC} $table : $COUNT ligne(s)"
    else
        echo -e "   ${YELLOW}⚠️${NC} $table : vide"
    fi
done
echo -e "${CYAN}📊 $FOUND / ${#TABLES[@]} tables peuplées${NC}"

if [ "$FOUND" -lt 10 ]; then
    echo -e "${YELLOW}⚠️ Certaines tables sont vides, mais ce n'est pas bloquant.${NC}"
fi

# 5. Lancer le serveur Next.js
echo -e "${YELLOW}🌐 Démarrage du serveur Next.js...${NC}"
echo -e "${GREEN}👉 Accédez à http://localhost:3000${NC}"
echo -e "${CYAN}Identifiants : avocat@test.com / Test@123456${NC}"

# Tuer l'ancien processus sur le port 3000 (si existant)
if sudo lsof -t -i:3000 &>/dev/null; then
    echo -e "${YELLOW}Un processus utilise déjà le port 3000. Arrêt...${NC}"
    sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null || true
    sleep 1
fi

# Lancer en premier plan pour voir les logs
npm run dev -- --hostname 0.0.0.0
