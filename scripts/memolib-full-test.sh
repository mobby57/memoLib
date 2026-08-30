#!/usr/bin/env bash

set -uo pipefail

ROOT="/home/moros/projects/memoLib"
LOG="/tmp/memolib-full-test-$(date +%Y%m%d-%H%M%S).log"
BASE_URL="${MEMOLIB_BASE_URL:-http://localhost:3000}"

cd "$ROOT"

PASS=0
FAIL=0
WARN=0

ok() {
  echo "✅ $1" | tee -a "$LOG"
  PASS=$((PASS + 1))
}

fail() {
  echo "❌ $1" | tee -a "$LOG"
  FAIL=$((FAIL + 1))
}

warn() {
  echo "⚠️  $1" | tee -a "$LOG"
  WARN=$((WARN + 1))
}

section() {
  echo
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG"
  echo " $1" | tee -a "$LOG"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG"
}

echo "MEMOLIB — FULL APPLICATION TEST" | tee "$LOG"
echo "Date : $(date)" | tee -a "$LOG"
echo "URL  : $BASE_URL" | tee -a "$LOG"

# ─────────────────────────────────────────────
# 1. ENVIRONNEMENT
# ─────────────────────────────────────────────

section "1. ENVIRONNEMENT"

command -v node >/dev/null && ok "Node disponible" || fail "Node absent"
command -v npm >/dev/null && ok "NPM disponible" || fail "NPM absent"

[[ -d node_modules ]] \
  && ok "node_modules présent" \
  || fail "node_modules absent"

[[ -f .env.local ]] \
  && ok ".env.local présent" \
  || fail ".env.local absent"

# ─────────────────────────────────────────────
# 2. TYPESCRIPT
# ─────────────────────────────────────────────

section "2. TYPESCRIPT"

if npx tsc --noEmit >>"$LOG" 2>&1; then
  ok "TypeScript"
else
  fail "TypeScript"
fi

# ─────────────────────────────────────────────
# 3. TESTS UNITAIRES
# ─────────────────────────────────────────────

section "3. TESTS UNITAIRES"

if npm test -- --run >>"$LOG" 2>&1; then
  ok "Suite Vitest complète"
else
  fail "Tests Vitest"
fi

# ─────────────────────────────────────────────
# 4. BUILD
# ─────────────────────────────────────────────

section "4. BUILD PRODUCTION"

if npm run build >>"$LOG" 2>&1; then
  ok "Build production"
else
  fail "Build production"
fi

# ─────────────────────────────────────────────
# 5. PLAYWRIGHT
# ─────────────────────────────────────────────

section "5. TEST E2E"

if [[ ! -d node_modules/@playwright ]]; then
  warn "Playwright non installé — test E2E ignoré"
else

  if npx playwright test --reporter=line >>"$LOG" 2>&1; then
    ok "Tests E2E Playwright"
  else
    fail "Tests E2E Playwright"
  fi

fi

# ─────────────────────────────────────────────
# 6. ROUTES HTTP
# ─────────────────────────────────────────────

section "6. ROUTES HTTP"

SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

if [[ ! -d .next ]]; then
  fail "Build .next absent"
else

  npm run start -- -p 3000 >>"$LOG" 2>&1 &
  SERVER_PID=$!

  echo "Attente du serveur..." | tee -a "$LOG"

  READY=0

  for i in $(seq 1 60); do
    if curl -fsS "$BASE_URL" >/dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 1
  done

  if [[ "$READY" == "1" ]]; then
    ok "Serveur Next.js opérationnel"
  else
    fail "Serveur Next.js inaccessible"
  fi

  check_route() {
    local route="$1"
    local expected="$2"

    local code
    code=$(curl -s -o /tmp/memolib-response.txt \
      -w "%{http_code}" \
      "$BASE_URL$route" || echo "000")

    case "$code" in
      2*|3*)
        ok "$route → HTTP $code"
        ;;
      *)
        fail "$route → HTTP $code"
        ;;
    esac
  }

  check_route "/"
  check_route "/login"
  check_route "/pricing"
  check_route "/contact"
  check_route "/faq"

fi

# ─────────────────────────────────────────────
# 7. API CRITIQUES
# ─────────────────────────────────────────────

section "7. API CRITIQUES"

check_api() {
  local route="$1"

  local code
  code=$(curl -s -o /tmp/memolib-api-response.txt \
    -w "%{http_code}" \
    "$BASE_URL$route" || echo "000")

  case "$code" in
    2*|3*|4*)
      ok "$route répond → HTTP $code"
      ;;
    5*)
      fail "$route → HTTP $code"
      ;;
    *)
      warn "$route → HTTP $code"
      ;;
  esac
}

check_api "/api/auth/session"
check_api "/api/health"

# ─────────────────────────────────────────────
# 8. STRIPE
# ─────────────────────────────────────────────

section "8. STRIPE"

if grep -R -n \
  -E "sk_test_dummy|sk_test_placeholder|fallback test key" \
  src/app src/lib \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  >/tmp/memolib-stripe-fallbacks.txt 2>/dev/null
then
  fail "Fallback Stripe détecté"
else
  ok "Aucun fallback Stripe dangereux"
fi

STRIPE_COUNT=$(grep -R -n "new Stripe(" src/app src/lib \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null | wc -l)

if [[ "$STRIPE_COUNT" == "1" ]]; then
  ok "Client Stripe unique"
else
  fail "Nombre de clients Stripe : $STRIPE_COUNT"
fi

# ─────────────────────────────────────────────
# 9. WEBHOOKS
# ─────────────────────────────────────────────

section "9. WEBHOOKS"

if grep -R -q "constructEvent\|parseStripeWebhookRequest" \
  src/app/api/webhooks/stripe \
  src/app/api/payments/webhook \
  2>/dev/null
then
  ok "Validation signature Stripe présente"
else
  fail "Validation signature Stripe absente"
fi

if grep -R -q \
  -E "isStripeEventDuplicate|stripeEventId|stripeWebhookEvent" \
  src/app src/lib \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null
then
  ok "Protection anti-duplication présente"
else
  fail "Protection anti-duplication absente"
fi

# ─────────────────────────────────────────────
# 10. GIT / FICHIERS SENSIBLES
# ─────────────────────────────────────────────

section "10. SÉCURITÉ GIT"

if git diff --name-only | grep -Ei \
  '(^|/)(\.env|\.env\.local|.*secret.*|.*password.*|.*credential.*)$' \
  >/tmp/memolib-sensitive.txt 2>/dev/null
then
  fail "Fichier sensible dans les modifications"
else
  ok "Aucun fichier sensible modifié"
fi

# ─────────────────────────────────────────────
# 11. RÉSUMÉ
# ─────────────────────────────────────────────

section "RÉSULTAT FINAL"

echo "PASS : $PASS" | tee -a "$LOG"
echo "WARN : $WARN" | tee -a "$LOG"
echo "FAIL : $FAIL" | tee -a "$LOG"

echo
echo "Log complet : $LOG"

if [[ "$FAIL" -eq 0 ]]; then
  echo
  echo "🟢 MEMOLIB — FULL TEST VALIDÉ"
  echo "L'application passe les contrôles automatisés."
  exit 0
else
  echo
  echo "🔴 MEMOLIB — FULL TEST ÉCHOUÉ"
  echo "Consulter : $LOG"
  exit 1
fi
