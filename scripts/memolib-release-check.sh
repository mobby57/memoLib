#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS=0
WARN=0
FAIL=0

ok() {
  echo "✅ $1"
  PASS=$((PASS + 1))
}

warn() {
  echo "⚠️  $1"
  WARN=$((WARN + 1))
}

fail() {
  echo "❌ $1"
  FAIL=$((FAIL + 1))
}

section() {
  echo
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " MEMOLIB — RELEASE CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Projet : $ROOT"
echo "Date   : $(date '+%Y-%m-%d %H:%M:%S')"

# ─────────────────────────────────────────────
# 1. ENV
# ─────────────────────────────────────────────

section "1. ENVIRONNEMENT"

if [[ -f ".env.local" ]]; then
  ok ".env.local présent"
else
  fail ".env.local absent"
fi

check_env() {
  local key="$1"

  if [[ ! -f ".env.local" ]]; then
    fail "$key impossible à vérifier"
    return
  fi

  local value
  value="$(grep -E "^${key}=" .env.local | tail -n 1 | cut -d= -f2-)"

  if [[ -n "${value//[[:space:]]/}" ]]; then
    ok "$key configurée"
  else
    fail "$key absente ou vide"
  fi
}

check_env "STRIPE_SECRET_KEY"
check_env "STRIPE_WEBHOOK_SECRET"

for key in \
  STRIPE_PRICE_SOLO_MONTHLY \
  STRIPE_PRICE_SOLO_YEARLY \
  STRIPE_PRICE_CABINET_MONTHLY \
  STRIPE_PRICE_CABINET_YEARLY \
  STRIPE_PRICE_ENTERPRISE_MONTHLY \
  STRIPE_PRICE_ENTERPRISE_YEARLY
do
  check_env "$key"
done

# ─────────────────────────────────────────────
# 2. DOUBLONS ENV
# ─────────────────────────────────────────────

section "2. DOUBLONS ENV"

if [[ -f ".env.local" ]]; then
  duplicates="$(
    grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.local \
      | sed 's/=.*//' \
      | sort \
      | uniq -d
  )"

  if [[ -z "$duplicates" ]]; then
    ok "Aucun doublon dans .env.local"
  else
    fail "Variables dupliquées :"
    echo "$duplicates"
  fi
fi

# ─────────────────────────────────────────────
# 3. STRIPE
# ─────────────────────────────────────────────

section "3. STRIPE"

if grep -R -n \
  -E "sk_test_dummy|sk_test_placeholder|fallback test key|fallback placeholder" \
  src \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  >/tmp/memolib-stripe-fallbacks.txt 2>/dev/null
then
  warn "Fallback Stripe détecté"
  cat /tmp/memolib-stripe-fallbacks.txt
else
  ok "Aucun fallback Stripe détecté"
fi

stripe_instances="$(
  grep -R -h -E "new Stripe\(" src \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    2>/dev/null \
    | wc -l
)"

echo "Instances new Stripe(...) : $stripe_instances"

if [[ "$stripe_instances" -le 2 ]]; then
  ok "Nombre raisonnable de clients Stripe"
else
  warn "Plusieurs clients Stripe indépendants détectés"
fi

# ─────────────────────────────────────────────
# 4. WEBHOOKS
# ─────────────────────────────────────────────

section "4. WEBHOOKS"

WEBHOOK1="src/app/api/webhooks/stripe/route.ts"
WEBHOOK2="src/app/api/payments/webhook/route.ts"

for file in "$WEBHOOK1" "$WEBHOOK2"; do
  if [[ -f "$file" ]]; then
    ok "$file présente"

    if grep -q "constructEvent" "$file"; then
      ok "Signature Stripe validée dans $file"
    elif [[ "$file" == "$WEBHOOK2" ]] &&          grep -q "parseStripeWebhookRequest" "$file" &&          grep -q "parseStripeWebhookRequest" "src/lib/stripe/webhook.ts" &&          grep -q "constructEvent" "src/lib/stripe/webhook.ts"; then
      ok "Signature Stripe validée via parseStripeWebhookRequest"
    else
      fail "Validation signature Stripe absente dans $file"
    fi
  else
    warn "$file absente"
  fi
done

if grep -R -n \
  -E "stripeEventId|isStripeEventDuplicate|stripeWebhookEvent" \
  "$WEBHOOK1" "$WEBHOOK2" \
  >/dev/null 2>&1
then
  ok "Protection contre les événements Stripe dupliqués détectée"
else
  fail "Protection anti-duplication Stripe absente"
fi

# ─────────────────────────────────────────────
# 5. ROUTES
# ─────────────────────────────────────────────

section "5. ROUTES PAIEMENT"

routes=(
  "src/app/api/billing/checkout/route.ts"
  "src/app/api/billing/portal/route.ts"
  "src/app/api/billing/manage/route.ts"
  "src/app/api/subscriptions/create/route.ts"
  "src/app/api/subscriptions/cancel/route.ts"
  "src/app/api/payments/create-checkout/route.ts"
  "src/app/api/payments/webhook/route.ts"
  "src/app/api/webhooks/stripe/route.ts"
)

for route in "${routes[@]}"; do
  if [[ -f "$route" ]]; then
    ok "$route"
  else
    warn "$route absente"
  fi
done

# ─────────────────────────────────────────────
# 6. PACKAGE
# ─────────────────────────────────────────────

section "6. NPM / NODE"

if [[ -f package.json ]]; then
  ok "package.json présent"
else
  fail "package.json absent"
fi

if [[ -d node_modules ]]; then
  ok "node_modules présent"
else
  fail "node_modules absent"
fi

echo "Node : $(node -v 2>/dev/null || echo absent)"
echo "NPM  : $(npm -v 2>/dev/null || echo absent)"

# ─────────────────────────────────────────────
# 7. TESTS
# ─────────────────────────────────────────────

section "7. TESTS"

if npm run test -- --run >/tmp/memolib-test.log 2>&1; then
  ok "Tests OK"
else
  fail "Tests échoués"
  tail -n 40 /tmp/memolib-test.log
fi

# ─────────────────────────────────────────────
# 8. BUILD
# ─────────────────────────────────────────────

section "8. BUILD PRODUCTION"

echo "Lancement de npm run build..."

if npm run build >/tmp/memolib-build.log 2>&1; then
  ok "BUILD PRODUCTION OK"
else
  fail "BUILD PRODUCTION échoué"
  echo
  echo "Dernières lignes du build :"
  tail -n 80 /tmp/memolib-build.log
fi

# ─────────────────────────────────────────────
# 9. GIT
# ─────────────────────────────────────────────

section "9. GIT"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "Dépôt Git détecté"

  branch="$(git branch --show-current)"
  echo "Branche : $branch"

  if [[ -z "$(git status --short)" ]]; then
    ok "Working tree propre"
  else
    warn "Modifications Git présentes"
    git status --short
  fi
else
  fail "Dépôt Git non détecté"
fi

# ─────────────────────────────────────────────
# 10. RÉSULTAT
# ─────────────────────────────────────────────

section "RÉSULTAT"

echo "PASS : $PASS"
echo "WARN : $WARN"
echo "FAIL : $FAIL"

echo

if [[ "$FAIL" -eq 0 ]]; then
  echo "🟢 MEMOLIB — RELEASE CHECK VALIDÉ"
  echo "Le projet peut passer à la phase de test réel."
  exit 0
else
  echo "🔴 MEMOLIB — RELEASE CHECK NON VALIDÉ"
  echo "Corrige les FAIL avant le lancement."
  exit 1
fi
