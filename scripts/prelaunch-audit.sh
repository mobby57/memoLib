#!/usr/bin/env bash

set -uo pipefail

# Toujours travailler depuis la racine du projet,
# quel que soit le dossier depuis lequel le script est lancé.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR" || exit 1

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
echo " MEMOLIB — PRE-LAUNCH AUDIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Projet : $PROJECT_DIR"
echo "Date   : $(date '+%Y-%m-%d %H:%M:%S')"

# ─────────────────────────────────────────────
# 1. ENV
# ─────────────────────────────────────────────

section "1. VARIABLES D'ENVIRONNEMENT"

if [[ -f ".env.local" ]]; then
  ok ".env.local présent"
else
  fail ".env.local absent"
fi

check_env() {
  local name="$1"

  if [[ ! -f ".env.local" ]]; then
    fail "$name impossible à vérifier : .env.local absent"
    return
  fi

  if grep -qE "^${name}=" .env.local; then
    local value
    value="$(grep -E "^${name}=" .env.local | head -n1 | cut -d= -f2- | xargs)"

    if [[ -n "$value" ]]; then
      ok "$name configurée"
    else
      fail "$name présente mais VIDE"
    fi
  else
    fail "$name absente de .env.local"
  fi
}

check_env "STRIPE_SECRET_KEY"
check_env "STRIPE_WEBHOOK_SECRET"

# ─────────────────────────────────────────────
# 2. STRIPE PRICE IDS
# ─────────────────────────────────────────────

section "2. STRIPE PRICE IDS"

for name in \
  STRIPE_PRICE_SOLO_MONTHLY \
  STRIPE_PRICE_SOLO_YEARLY \
  STRIPE_PRICE_CABINET_MONTHLY \
  STRIPE_PRICE_CABINET_YEARLY \
  STRIPE_PRICE_ENTERPRISE_MONTHLY \
  STRIPE_PRICE_ENTERPRISE_YEARLY
do
  check_env "$name"
done

# ─────────────────────────────────────────────
# 3. DOUBLONS
# ─────────────────────────────────────────────

section "3. DOUBLONS DANS .env.local"

if [[ -f ".env.local" ]]; then
  duplicates="$(
    grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.local \
      | sed 's/=.*//' \
      | sort \
      | uniq -d
  )"

  if [[ -z "$duplicates" ]]; then
    ok "Aucun doublon de variable détecté"
  else
    fail "Doublons détectés :"
    echo "$duplicates" | sed 's/^/   - /'
  fi
fi

# ─────────────────────────────────────────────
# 4. SOURCES STRIPE
# ─────────────────────────────────────────────

section "4. CONFIGURATION STRIPE DANS SRC"

if [[ -d "src" ]]; then

  if grep -R -q "STRIPE_SECRET_KEY" src --exclude-dir=node_modules --exclude-dir=.next; then
    ok "STRIPE_SECRET_KEY utilisée dans src"
  else
    warn "STRIPE_SECRET_KEY non trouvée dans src"
  fi

  stripe_instances="$(
    grep -R -h -o "new Stripe(" src \
      --exclude-dir=node_modules \
      --exclude-dir=.next 2>/dev/null \
      | wc -l
  )"

  echo "Instances 'new Stripe(...)' détectées : $stripe_instances"

  if [[ "$stripe_instances" -le 3 ]]; then
    ok "Nombre raisonnable de clients Stripe"
  else
    warn "Plusieurs instances Stripe — vérifier l'architecture"
  fi

else
  fail "Répertoire src absent"
fi

# ─────────────────────────────────────────────
# 5. FALLBACKS STRIPE
# ─────────────────────────────────────────────

section "5. FALLBACKS STRIPE"

fallbacks="$(
  grep -R -n -E \
    "sk_test_dummy|sk_test_placeholder|sk_live_placeholder|fallback test key" \
    src \
    --exclude-dir=node_modules \
    --exclude-dir=.next 2>/dev/null || true
)"

if [[ -z "$fallbacks" ]]; then
  ok "Aucun fallback Stripe dangereux détecté"
else
  warn "Fallback(s) Stripe détecté(s) :"
  echo "$fallbacks"
fi

# ─────────────────────────────────────────────
# 6. ROUTES PAIEMENT
# ─────────────────────────────────────────────

section "6. ROUTES PAIEMENT"

routes=(
  "src/app/api/billing/checkout/route.ts"
  "src/app/api/billing/portal/route.ts"
  "src/app/api/subscriptions/create/route.ts"
  "src/app/api/subscriptions/cancel/route.ts"
  "src/app/api/payments/create-checkout/route.ts"
  "src/app/api/payments/webhook/route.ts"
  "src/app/api/webhooks/stripe/route.ts"
)

for route in "${routes[@]}"; do
  if [[ -f "$route" ]]; then
    ok "$route présente"
  else
    warn "$route absente"
  fi
done

# ─────────────────────────────────────────────
# 7. WEBHOOK
# ─────────────────────────────────────────────

section "7. WEBHOOK STRIPE"

webhook_files=(
  "src/app/api/payments/webhook/route.ts"
  "src/app/api/webhooks/stripe/route.ts"
)

webhook_found=0

for file in "${webhook_files[@]}"; do
  if [[ -f "$file" ]]; then
    webhook_found=1

    if grep -q "constructEvent" "$file" || \
       grep -q "parseStripeWebhookRequest" "$file"; then
      ok "Validation signature webhook détectée dans $file"
    else
      fail "Validation signature webhook absente dans $file"
    fi

    if grep -q "stripeEventId" "$file"; then
      ok "Protection contre doublons stripeEventId détectée"
    else
      warn "Aucune gestion stripeEventId détectée dans $file"
    fi
  fi
done

if [[ "$webhook_found" -eq 0 ]]; then
  fail "Aucun webhook Stripe trouvé"
fi

# ─────────────────────────────────────────────
# 8. NPM / TYPESCRIPT
# ─────────────────────────────────────────────

section "8. NPM / TYPESCRIPT"

if [[ -f "package.json" ]]; then
  ok "package.json présent"
else
  fail "package.json absent"
fi

if [[ -d "node_modules" ]]; then
  ok "node_modules présent"
else
  warn "node_modules absent"
fi

echo "Node : $(node --version 2>/dev/null || echo 'absent')"
echo "NPM  : $(npm --version 2>/dev/null || echo 'absent')"

# ─────────────────────────────────────────────
# 9. GIT
# ─────────────────────────────────────────────

section "9. GIT"

if [[ -d ".git" ]]; then
  ok "Dépôt Git détecté"

  branch="$(git branch --show-current 2>/dev/null || true)"
  [[ -n "$branch" ]] && echo "Branche : $branch"

  if git diff --quiet 2>/dev/null; then
    ok "Aucune modification Git non commitée"
  else
    warn "Modifications Git non commitée(s)"
  fi
else
  warn "Dépôt Git non détecté"
fi

# ─────────────────────────────────────────────
# 10. BUILD
# ─────────────────────────────────────────────

section "10. BUILD PRODUCTION"

if [[ -f "package.json" ]]; then
  echo "Lancement de npm run build..."
  echo

  if npm run build; then
    ok "BUILD PRODUCTION réussi"
  else
    fail "BUILD PRODUCTION échoué"
  fi
else
  fail "Build impossible : package.json absent"
fi

# ─────────────────────────────────────────────
# RESULTAT
# ─────────────────────────────────────────────

section "RÉSULTAT"

echo
echo "✅ PASS : $PASS"
echo "⚠️  WARN : $WARN"
echo "❌ FAIL : $FAIL"
echo

if [[ "$FAIL" -eq 0 ]]; then
  echo "🟢 MEMOLIB PRÊT POUR LE PROCHAIN TEST DE LANCEMENT"
  exit 0
else
  echo "🔴 AUDIT NON VALIDÉ"
  echo "Corrige les erreurs ❌ avant le lancement."
  exit 1
fi
