#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_URL="${1:-https://memolib-production-6786.up.railway.app}"
API_URL="${APP_URL}/api"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/railway}"

echo -e "${BLUE}🧪 Tests E2E – MemoLib${NC}"
echo "   Application : $APP_URL"
echo "   API         : $API_URL"
echo "   Base        : $DATABASE_URL"
echo "----------------------------------------"

PASSED=0
FAILED=0
SKIPPED=0

test_pass() { echo -e "   ${GREEN}✅ $1${NC}"; ((PASSED++)); }
test_fail() { echo -e "   ${RED}❌ $1${NC}"; ((FAILED++)); }
test_skip() { echo -e "   ${YELLOW}⏭️  $1${NC}"; ((SKIPPED++)); }

test_api() {
  local endpoint=$1
  local method=${2:-GET}
  local data=${3:-}
  local expected_status=${4:-200}
  local description=${5:-"API $method $endpoint"}

  echo -n "   → $description ... "
  if [ "$method" = "GET" ]; then
    response=$(curl -s -L -o /dev/null -w "%{http_code}" "$API_URL/$endpoint")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$API_URL/$endpoint")
  fi

  if [ "$response" -eq "$expected_status" ]; then
    test_pass "$description (status $response)"
  else
    test_fail "$description (status $response attendu $expected_status)"
  fi
}

echo -e "\n${BLUE}🌐 1. Application Web${NC}"
test_api "" GET "" 200 "Page d'accueil"

echo -e "\n${BLUE}🔐 2. Authentification${NC}"
test_api "auth/signin" GET "" 200 "Page de login"
test_api "auth/session" GET "" 200 "Session non authentifiée"
if [ ! -z "$NEXTAUTH_SECRET" ]; then
  test_api "auth/register" POST '{"email":"test@e2e.fr","password":"Test123!"}' 201 "Inscription utilisateur"
else
  test_skip "Inscription (NEXTAUTH_SECRET non défini)"
fi

echo -e "\n${BLUE}⚖️ 3. CESEDA${NC}"
test_skip "Détection OQTF (route à vérifier)"
test_skip "Calcul délai OQTF (route à vérifier)"

echo -e "\n${BLUE}❤️ 4. Health Check${NC}"
test_api "health" GET "" 200 "Health check"

echo -e "\n${BLUE}🗄️ 5. Base de données${NC}"
if command -v psql &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
  echo -n "   → Connexion à la base ... "
  if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null 2>&1; then
    test_pass "Connexion à la base de données"
    echo -n "   → Vérification des migrations ... "
    if psql "$DATABASE_URL" -c "SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 1;" &> /dev/null; then
      test_pass "Migrations Prisma appliquées"
    else
      test_fail "Migrations Prisma non appliquées"
    fi
  else
    test_fail "Connexion à la base de données (URL incorrecte ou inaccessible)"
  fi
else
  test_skip "Tests base de données (psql ou DATABASE_URL non disponible)"
fi

echo -e "\n${BLUE}📧 6. Emails entrants${NC}"
if [ ! -z "$RESEND_WEBHOOK_SECRET" ]; then
  test_api "inbound" POST '{"type":"email.received","data":{"from":"test@test.fr","to":"test@test.fr","subject":"Test E2E","text":"Contenu de test"}}' 200 "Webhook inbound"
else
  test_skip "Webhook inbound (RESEND_WEBHOOK_SECRET non défini)"
fi

echo -e "\n${BLUE}🔒 7. Sécurité${NC}"
MISSING=""
for var in ENCRYPTION_MASTER_KEY CRON_SECRET; do
  if [ -z "${!var}" ]; then
    MISSING="$MISSING $var"
  fi
done
if [ -z "$MISSING" ]; then
  test_pass "Variables de sécurité définies"
else
  test_fail "Variables de sécurité manquantes :$MISSING"
fi

echo -n "   → Vérification des secrets dans le code ... "
if grep -r "ENCRYPTION_MASTER_KEY" src/ --exclude-dir=node_modules --exclude-dir=__tests__ &> /dev/null; then
  test_fail "Secret ENCRYPTION_MASTER_KEY trouvé dans le code source"
else
  test_pass "Aucun secret trouvé dans le code source"
fi

if [ ! -z "$STRIPE_SECRET_KEY" ]; then
  echo -e "\n${BLUE}💳 8. Stripe${NC}"
  test_api "billing/plans" GET "" 200 "Récupération des plans"
  test_api "billing/checkout" POST '{"plan":"SOLO","interval":"monthly"}' 200 "Création checkout"
else
  echo -e "\n${BLUE}💳 8. Stripe${NC}"
  test_skip "Stripe (STRIPE_SECRET_KEY non défini)"
fi

if [ ! -z "$PISTE_PROD_CLIENT_ID" ]; then
  echo -e "\n${BLUE}📜 9. Légifrance (PISTE)${NC}"
  test_api "legifrance/search" POST '{"query":"OQTF"}' 200 "Recherche jurisprudence"
else
  echo -e "\n${BLUE}📜 9. Légifrance (PISTE)${NC}"
  test_skip "Légifrance (PISTE non configuré)"
fi

if [ ! -z "$UPSTASH_REDIS_REST_URL" ]; then
  echo -e "\n${BLUE}📦 10. Cache Redis${NC}"
  test_api "cache/test" GET "" 200 "Cache Redis accessible"
else
  echo -e "\n${BLUE}📦 10. Cache Redis${NC}"
  test_skip "Cache Redis (UPSTASH_REDIS_REST_URL non défini)"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Résumé des tests${NC}"
echo -e "   ${GREEN}Réussis : $PASSED${NC}"
echo -e "   ${RED}Échecs   : $FAILED${NC}"
echo -e "   ${YELLOW}Ignorés  : $SKIPPED${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les tests ont réussi !${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED tests ont échoué.${NC}"
  exit 1
fi
