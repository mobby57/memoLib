#!/bin/bash
# auto-reset-and-launch.sh
# Réinitialise la base, crée ActionProposal si nécessaire, seed, audit et lance le serveur

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Réinitialisation complète et lancement automatique...${NC}"

# 1. Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL non définie.${NC}"
    echo -e "${YELLOW}💡 Exécutez : export DATABASE_URL=\$(grep DATABASE_URL .env | cut -d '=' -f2-)${NC}"
    exit 1
fi

# 2. Réinitialiser la base (supprime et recrée toutes les tables)
echo -e "${YELLOW}📦 Réinitialisation de la base avec prisma db push --force-reset...${NC}"
npx prisma db push --force-reset

# 3. Vérifier si ActionProposal existe
TABLE_EXISTS=$(PGPASSWORD='npg_jH3oCNW4eAEI' psql -h ep-lucky-dust-b2vvw0a8-pooler.c-6.eu-central-1.aws.neon.tech -p 5432 -U neondb_owner -d neondb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ActionProposal');" 2>/dev/null | tr -d ' ')
if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ Table ActionProposal déjà présente.${NC}"
else
    echo -e "${YELLOW}🔧 Création de la table ActionProposal et de ses dépendances...${NC}"
    cat > /tmp/create-actionproposal.sql << 'SQL'
-- Création des enums (si inexistants)
DO $$ BEGIN
    CREATE TYPE "ActionProposalType" AS ENUM ('REVIEW_EMAIL', 'CREATE_DOSSIER', 'CREATE_LEGAL_DEADLINE', 'REQUEST_DOCUMENTS', 'SCHEDULE_APPOINTMENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActionProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActionProposalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActionProposalRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Création de la table
CREATE TABLE IF NOT EXISTS "ActionProposal" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "emailId" UUID,
    "dossierId" UUID,
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

    npx prisma db execute --file /tmp/create-actionproposal.sql
    echo -e "${GREEN}✅ Table ActionProposal créée.${NC}"
fi

# 4. Exécuter le seed SQL
echo -e "${YELLOW}🌱 Insertion des données de test...${NC}"
if [ -f "scripts/seed-final.sql" ]; then
    npx prisma db execute --file scripts/seed-final.sql
else
    echo -e "${RED}❌ scripts/seed-final.sql introuvable. Créez-le avec le contenu approprié.${NC}"
    exit 1
fi

# 5. Audit des tables critiques
echo -e "${YELLOW}🔍 Audit des tables critiques...${NC}"
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
    echo -e "${YELLOW}⚠️ Certaines tables sont vides, vérifiez le seed.${NC}"
fi

# 6. Lancer le serveur Next.js
echo -e "${YELLOW}🌐 Démarrage du serveur Next.js...${NC}"
echo -e "${GREEN}👉 Accédez à http://localhost:3000${NC}"
echo -e "${CYAN}Identifiants : avocat@test.com / Test@123456${NC}"

# Tuer le processus sur le port 3000
if sudo lsof -t -i:3000 &>/dev/null; then
    echo -e "${YELLOW}Port 3000 occupé, arrêt du processus...${NC}"
    sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null || true
    sleep 1
fi

npm run dev -- --hostname 0.0.0.0
