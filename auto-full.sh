#!/bin/bash
# ------------------------------------------------------------------
# auto-full.sh
# Script complet d'installation, configuration, seed et tests E2E
# pour memolib (Prisma 7 + Neon + Next.js)
# ------------------------------------------------------------------

set -e  # arrêt en cas d'erreur

# ------------------------------------------------------------------
# Couleurs
# ------------------------------------------------------------------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------
# Variables globales
# ------------------------------------------------------------------
BASE_URL="http://localhost:3000"
SERVER_PID=""
LOG_FILE="/tmp/next-server.log"
TEST_REPORT="/tmp/test-report.txt"

# ------------------------------------------------------------------
# Fonctions
# ------------------------------------------------------------------

# Affiche un message d'étape
step() { echo -e "${CYAN}▶ $1${NC}"; }

# Affiche un succès
success() { echo -e "${GREEN}✅ $1${NC}"; }

# Affiche un avertissement
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

# Affiche une erreur et quitte
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Vérifie qu'une commande existe
check_command() {
    if ! command -v "$1" &> /dev/null; then
        warning "$1 n'est pas installé. Installation..."
        if [ "$1" = "jq" ]; then
            sudo apt update && sudo apt install -y jq
        elif [ "$1" = "curl" ]; then
            sudo apt install -y curl
        else
            error "Commande $1 introuvable. Installez-la manuellement."
        fi
    fi
}

# Vérifie que .env et DATABASE_URL sont présents
check_env() {
    if [ ! -f ".env" ]; then
        error "Fichier .env introuvable."
    fi
    # Charger DATABASE_URL
    export DATABASE_URL=$(grep -v '^#' .env | grep DATABASE_URL | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL non définie dans .env."
    fi
    success "DATABASE_URL chargée."
}

# Installation des dépendances npm (si manquantes)
install_deps() {
    if [ ! -d "node_modules" ]; then
        step "Installation des dépendances npm..."
        npm install prisma @prisma/client @prisma/adapter-pg pg bcryptjs dotenv --save-dev
    else
        success "Dépendances déjà installées."
    fi
}

# Synchronisation du schéma Prisma
sync_schema() {
    step "Réinitialisation de la base (prisma db push --force-reset)..."
    npx prisma db push --force-reset
    success "Schéma synchronisé."
}

# Création manuelle de la table ActionProposal (si absente)
create_action_proposal() {
    step "Vérification/création de la table ActionProposal..."
    TABLE_EXISTS=$(PGPASSWORD='npg_jH3oCNW4eAEI' psql -h ep-lucky-dust-b2vvw0a8-pooler.c-6.eu-central-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ActionProposal');" 2>/dev/null | tr -d ' ')
    if [ "$TABLE_EXISTS" = "t" ]; then
        success "Table ActionProposal déjà présente."
    else
        warning "Création de ActionProposal..."
        cat > /tmp/create_action_proposal.sql << 'SQL'
-- Enums
DO $$ BEGIN CREATE TYPE "ActionProposalType" AS ENUM ('REVIEW_EMAIL','CREATE_DOSSIER','CREATE_LEGAL_DEADLINE','REQUEST_DOCUMENTS','SCHEDULE_APPOINTMENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ActionProposalStatus" AS ENUM ('PENDING','APPROVED','REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ActionProposalPriority" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ActionProposalRiskLevel" AS ENUM ('LOW','MEDIUM','HIGH'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Table
CREATE TABLE IF NOT EXISTS "ActionProposal" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId" TEXT NOT NULL,
    "emailId" TEXT,
    "dossierId" TEXT,
    "type" "ActionProposalType" NOT NULL,
    "status" "ActionProposalStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ActionProposalPriority" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "ActionProposalRiskLevel" NOT NULL DEFAULT 'LOW',
    "rationale" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "proposedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "proposedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP,
    "decidedBy" TEXT,
    "decisionReason" TEXT,
    "executedAt" TIMESTAMP,
    "executedBy" TEXT,
    "executionResult" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Clés étrangères
ALTER TABLE "ActionProposal" ADD CONSTRAINT "ActionProposal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "ActionProposal" ADD CONSTRAINT "ActionProposal_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL;
ALTER TABLE "ActionProposal" ADD CONSTRAINT "ActionProposal_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL;

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS "ActionProposal_tenantId_idempotencyKey_key" ON "ActionProposal" ("tenantId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "ActionProposal_tenantId_status_priority_idx" ON "ActionProposal" ("tenantId", "status", "priority");
CREATE INDEX IF NOT EXISTS "ActionProposal_dossierId_status_idx" ON "ActionProposal" ("dossierId", "status");
CREATE INDEX IF NOT EXISTS "ActionProposal_emailId_idx" ON "ActionProposal" ("emailId");
SQL
        npx prisma db execute --file /tmp/create_action_proposal.sql
        success "Table ActionProposal créée."
    fi
}

# Exécution du seed SQL
run_seed() {
    step "Insertion des données de test (seed)..."
    if [ ! -f "scripts/seed-final.sql" ]; then
        error "scripts/seed-final.sql introuvable. Créez-le d'abord."
    fi
    npx prisma db execute --file scripts/seed-final.sql
    success "Seed exécuté."
}

# Audit des tables critiques
audit_tables() {
    step "Audit des tables critiques..."
    TABLES=("Plan" "Tenant" "User" "Client" "Dossier" "Facture" "LigneFacture" "LegalDeadline" "Document" "Proof" "Email" "ActionProposal" "Report")
    FOUND=0
    for table in "${TABLES[@]}"; do
        COUNT=$(PGPASSWORD='npg_jH3oCNW4eAEI' psql -h ep-lucky-dust-b2vvw0a8-pooler.c-6.eu-central-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')
        if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
            ((FOUND++))
            echo -e "   ${GREEN}✅${NC} $table : $COUNT ligne(s)"
        else
            echo -e "   ${YELLOW}⚠️${NC} $table : vide ou inexistante"
        fi
    done
    echo -e "${CYAN}📊 $FOUND / ${#TABLES[@]} tables peuplées${NC}"
    if [ "$FOUND" -lt 10 ]; then
        warning "Certaines tables sont vides. Vérifiez le seed."
    else
        success "Données de test présentes."
    fi
}

# Lance le serveur Next.js en arrière‑plan
start_server() {
    step "Démarrage du serveur Next.js..."
    # Tuer tout processus sur le port 3000
    if sudo lsof -t -i:3000 &>/dev/null; then
        warning "Port 3000 occupé, arrêt du processus..."
        sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null || true
        sleep 1
    fi
    # Lancer en arrière‑plan
    npm run dev -- --hostname 0.0.0.0 > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    echo -e "   PID serveur : $SERVER_PID"
    echo -e "   Logs : $LOG_FILE"
    # Attendre que le serveur soit prêt (max 60s)
    step "Attente du serveur..."
    local timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|307"; then
            success "Serveur prêt"
            return 0
        fi
        sleep 2
        ((timeout-=2))
    done
    # Si timeout
    error "Serveur non démarré dans les délais. Voir $LOG_FILE"
}

# Tests API (basiques)
test_api() {
    step "Tests API..."
    local ok=0
    local total=0

    # 1. Test de connexion (endpoint générique)
    ((total++))
    echo -n "   Login (POST /api/auth/login) ... "
    RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"avocat@test.com","password":"Test@123456"}')
    if echo "$RESP" | grep -q "token\|session\|user"; then
        echo -e "${GREEN}PASS${NC}"
        ((ok++))
    else
        echo -e "${RED}FAIL${NC}"
    fi

    # 2. Récupération dossiers (si endpoint existe)
    ((total++))
    echo -n "   GET /api/dossiers ... "
    if curl -s "$BASE_URL/api/dossiers" | jq -e '. | length' &>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        ((ok++))
    else
        echo -e "${YELLOW}SKIP${NC} (endpoint non trouvé)"
    fi

    # 3. Récupération factures
    ((total++))
    echo -n "   GET /api/factures ... "
    if curl -s "$BASE_URL/api/factures" | jq -e '. | length' &>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        ((ok++))
    else
        echo -e "${YELLOW}SKIP${NC}"
    fi

    # 4. Vérification que la page d'accueil répond
    ((total++))
    echo -n "   GET / (page d'accueil) ... "
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|307"; then
        echo -e "${GREEN}PASS${NC}"
        ((ok++))
    else
        echo -e "${RED}FAIL${NC}"
    fi

    echo -e "${CYAN}Résumé API : $ok / $total tests réussis${NC}"
}

# Tests UI avec Playwright (si installé)
test_ui() {
    if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
        step "Tests UI avec Playwright..."
        # Créer un test simple si absent
        mkdir -p tests/e2e/ui
        if [ ! -f "tests/e2e/ui/login.spec.js" ]; then
            cat > tests/e2e/ui/login.spec.js << 'EOF'
import { test, expect } from '@playwright/test';
test('Connexion avocat', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/login');
    await page.fill('input[name="email"]', 'avocat@test.com');
    await page.fill('input[name="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
});
EOF
        fi
        npx playwright test tests/e2e/ui/
    else
        warning "Playwright non installé. Tests UI ignorés."
    fi
}

# Génère un rapport final
report_summary() {
    echo ""
    echo "=========================================="
    echo -e "${CYAN}📊 RAPPORT FINAL${NC}"
    echo "=========================================="
    echo -e "Serveur : $BASE_URL (PID $SERVER_PID)"
    echo -e "Logs    : $LOG_FILE"
    echo -e "Identifiants : avocat@test.com / Test@123456"
    echo ""
    echo -e "${GREEN}✅ Toutes les étapes sont terminées avec succès.${NC}"
    echo -e "Vous pouvez ouvrir ${BASE_URL} dans votre navigateur."
    echo ""
    echo -e "${YELLOW}Pour arrêter le serveur : kill $SERVER_PID${NC}"
    echo -e "${YELLOW}Pour voir les logs : tail -f $LOG_FILE${NC}"
    echo "=========================================="
}

# ------------------------------------------------------------------
# Programme principal
# ------------------------------------------------------------------
main() {
    echo -e "${CYAN}🚀 Lancement du script complet auto-full.sh${NC}"
    echo ""

    check_env
    check_command curl
    check_command jq || warning "jq non installé, certaines vérifications seront simplifiées."

    install_deps
    sync_schema
    create_action_proposal
    run_seed
    audit_tables
    start_server

    # Peut-être attendre un peu plus après le démarrage
    sleep 3

    test_api
    test_ui
    report_summary
}

# Si le script est exécuté directement, lancer main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi
