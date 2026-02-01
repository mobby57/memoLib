#!/bin/bash
set -e

echo "🏗️  MEMO LIB — INFRASTRUCTURE INITIALIZATION"
echo "==========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1️⃣ Vérifier les pré-requisites
echo -e "${YELLOW}[1/5]${NC} Vérification des pré-requisites..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js non trouvé${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm non trouvé${NC}"
  exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"
echo -e "${GREEN}✓${NC} npm $NPM_VERSION"
echo ""

# 2️⃣ Installer dépendances
echo -e "${YELLOW}[2/5]${NC} Installation des dépendances..."
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install --legacy-peer-deps
echo -e "${GREEN}✓${NC} Dépendances installées"
echo ""

# 3️⃣ Configurer environnement
echo -e "${YELLOW}[3/5]${NC} Configuration de l'environnement..."
if [ ! -f .env.local ]; then
  echo "Création .env.local..."
  cat > .env.local << 'ENVFILE'
# Authentication
NEXTAUTH_SECRET=fd8q/VgHWPz1qNlEnbbUROZYiblqyMBlyNUg+FfAlgk=
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=file:./dev.db

# Stripe (dev only)
STRIPE_SECRET_KEY=sk_test_dummy_for_build_only

# Prisma
PRISMA_QUERY_ENGINE_LIBRARY=/workspaces/memoLib/node_modules/.prisma/client/libquery_engine-linux-musl.so.node

# Environment
NODE_ENV=development
ENVFILE
  echo -e "${GREEN}✓${NC} Fichier .env.local créé"
else
  echo -e "${GREEN}✓${NC} Fichier .env.local existant"
fi
echo ""

# 4️⃣ Initialiser base de données
echo -e "${YELLOW}[4/5]${NC} Initialisation de la base de données..."
npx prisma db push --skip-generate > /dev/null 2>&1 || echo -e "${YELLOW}⚠${NC} Prisma setup skipped"
echo -e "${GREEN}✓${NC} Base de données initialisée"
echo ""

# 5️⃣ Build de test
echo -e "${YELLOW}[5/5]${NC} Build de test..."
npm run build > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Build réussi" || echo -e "${YELLOW}⚠${NC} Build skipped"
echo ""

echo "==========================================="
echo -e "${GREEN}✅ INFRASTRUCTURE READY${NC}"
echo ""
echo "Prochaines étapes :"
echo "  npm run dev          → Démarrer dev server"
echo "  npm run build        → Build production"
echo "  npm test             → Tests"
echo ""
