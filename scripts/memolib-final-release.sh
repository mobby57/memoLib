#!/usr/bin/env bash
set -uo pipefail

PROJECT_DIR="/home/moros/projects/memoLib"
cd "$PROJECT_DIR" || exit 1

PASS=0
WARN=0
FAIL=0

ok()   { echo "✅ $1"; PASS=$((PASS+1)); }
warn() { echo "⚠️  $1"; WARN=$((WARN+1)); }
fail() { echo "❌ $1"; FAIL=$((FAIL+1)); }

section() {
  echo
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " MEMOLIB — FINAL RELEASE CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Projet : $PROJECT_DIR"
echo "Date   : $(date '+%Y-%m-%d %H:%M:%S')"

# ─────────────────────────────────────────────
# 1. POSITION PROJET
# ─────────────────────────────────────────────

section "1. PROJET"

if [[ "$PWD" == "$PROJECT_DIR" ]]; then
  ok "Répertoire projet correct"
else
  fail "Mauvais répertoire"
fi

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

# ─────────────────────────────────────────────
# 2. ENV
# ─────────────────────────────────────────────

section "2. ENVIRONNEMENT"

if [[ -f .env.local ]]; then
  ok ".env.local présente"
else
  fail ".env.local absente"
fi

required_env=(
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_SOLO_MONTHLY
  STRIPE_PRICE_SOLO_YEARLY
  STRIPE_PRICE_CABINET_MONTHLY
  STRIPE_PRICE_CABINET_YEARLY
  STRIPE_PRICE_ENTERPRISE_MONTHLY
  STRIPE_PRICE_ENTERPRISE_YEARLY
)

for key in "${required_env[@]}"; do
  if [[ -f .env.local ]] && grep -Eq "^${key}=[^[:space:]]+" .env.local; then
    ok "$key configurée"
  else
    fail "$key absente ou vide"
  fi
done

# ─────────────────────────────────────────────
# 3. SECRETS GIT
# ─────────────────────────────────────────────

section "3. SÉCURITÉ GIT"

if git check-ignore -q .env.local 2>/dev/null; then
  ok ".env.local ignorée par Git"
else
  fail ".env.local n'est pas ignorée par Git"
fi

if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  fail ".env.local est suivie par Git"
else
  ok ".env.local non suivie par Git"
fi

# Recherche de clés secrètes évidentes dans le code suivi
if git grep -nE \
  'sk_(live|test)_[A-Za-z0-9]+' \
  -- ':!*.lock' ':!package-lock.json' \
  >/tmp/memolib-secret-scan.txt 2>/dev/null; then

  fail "Clé Stripe détectée dans les fichiers Git suivis"
  sed -n '1,20p' /tmp/memolib-secret-scan.txt
else
  ok "Aucune clé Stripe détectée dans Git"
fi

# ─────────────────────────────────────────────
# 4. FALLBACKS STRIPE
# ─────────────────────────────────────────────

section "4. STRIPE — FALLBACKS"

fallback_hits="$(grep -R -n \
  -E "sk_test_dummy|sk_test_placeholder|fallback test key|fallback placeholder" \
  src \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null || true)"

if [[ -n "$fallback_hits" ]]; then
  warn "Fallback Stripe encore présent"
  echo "$fallback_hits"
else
  ok "Aucun fallback Stripe dangereux"
fi

# ─────────────────────────────────────────────
# 5. CLIENTS STRIPE
# ─────────────────────────────────────────────

section "5. STRIPE — CLIENT UNIQUE"

stripe_instances="$(grep -R -n \
  "new Stripe(" \
  src \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null || true)"

stripe_count="$(printf '%s\n' "$stripe_instances" | grep -c "new Stripe(" || true)"

echo "Instances new Stripe(...) : $stripe_count"

if [[ "$stripe_count" -eq 1 ]]; then
  ok "Un seul client Stripe"
elif [[ "$stripe_count" -eq 0 ]]; then
  fail "Aucun client Stripe détecté"
else
  warn "Plusieurs clients Stripe détectés"
  echo "$stripe_instances"
fi

# Vérifie les imports directs suspects dans les routes
direct_stripe="$(grep -R -n \
  -E "from ['\"]stripe['\"]|require\(['\"]stripe['\"]\)" \
  src/app/api \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  2>/dev/null || true)"

if [[ -n "$direct_stripe" ]]; then
  warn "Import direct de Stripe dans des routes API"
  echo "$direct_stripe"
else
  ok "Routes API utilisent un client Stripe centralisé"
fi

# ─────────────────────────────────────────────
# 6. WEBHOOKS
# ─────────────────────────────────────────────

section "6. WEBHOOKS STRIPE"

WEBHOOKS=(
  "src/app/api/webhooks/stripe/route.ts"
  "src/app/api/payments/webhook/route.ts"
)

for webhook in "${WEBHOOKS[@]}"; do
  if [[ -f "$webhook" ]]; then
    ok "$webhook présente"

    if grep -q "constructEvent" "$webhook"; then
      ok "Signature Stripe validée : $webhook"
    else
      fail "constructEvent absent : $webhook"
    fi
  else
    warn "$webhook absente"
  fi
done

if grep -R -n \
  -E "isStripeEventDuplicate|stripeEventId|stripeWebhookEvent" \
  src/app/api src/lib \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  >/dev/null 2>&1; then

  ok "Protection anti-duplication Stripe détectée"
else
  fail "Protection anti-duplication Stripe absente"
fi

# ─────────────────────────────────────────────
# 7. ROUTES CRITIQUES
# ─────────────────────────────────────────────

section "7. ROUTES PAIEMENT"

ROUTES=(
  "src/app/api/billing/checkout/route.ts"
  "src/app/api/billing/portal/route.ts"
  "src/app/api/billing/manage/route.ts"
  "src/app/api/subscriptions/create/route.ts"
  "src/app/api/subscriptions/cancel/route.ts"
  "src/app/api/payments/create-checkout/route.ts"
  "src/app/api/payments/methods/route.ts"
  "src/app/api/payments/webhook/route.ts"
  "src/app/api/webhooks/stripe/route.ts"
)

for route in "${ROUTES[@]}"; do
  if [[ -f "$route" ]]; then
    ok "$route"
  else
    fail "$route absente"
  fi
done

# ─────────────────────────────────────────────
# 8. TESTS
# ─────────────────────────────────────────────

section "8. TESTS"

if npm test -- --run; then
  ok "Tous les tests passent"
else
  fail "Tests échoués"
fi

# ─────────────────────────────────────────────
# 9. BUILD
# ─────────────────────────────────────────────

section "9. BUILD PRODUCTION"

if npm run build; then
  ok "BUILD PRODUCTION OK"
else
  fail "BUILD PRODUCTION échoué"
fi

# ─────────────────────────────────────────────
# 10. GIT
# ─────────────────────────────────────────────

section "10. GIT"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "Dépôt Git détecté"

  branch="$(git branch --show-current)"
  echo "Branche : ${branch:-DETACHED}"

  if git diff --quiet && git diff --cached --quiet; then
    ok "Aucune modification Git"
  else
    warn "Modifications Git présentes"
    git status --short
  fi
else
  fail "Dépôt Git absent"
fi

# ─────────────────────────────────────────────
# 11. DIFF DANGEREUX
# ─────────────────────────────────────────────

section "11. FICHIERS SENSIBLES"

sensitive_hits="$(git status --short 2>/dev/null | grep -E \
  '(^|/)(\.env|\.env\.local|credentials|secrets|.*\.pem|.*\.key)' \
  || true)"

if [[ -n "$sensitive_hits" ]]; then
  fail "Modification/fichier sensible détecté"
  echo "$sensitive_hits"
else
  ok "Aucun fichier sensible dans les modifications Git"
fi

# ─────────────────────────────────────────────
# 12. VERDICT
# ─────────────────────────────────────────────

section "RÉSULTAT FINAL"

echo "PASS : $PASS"
echo "WARN : $WARN"
echo "FAIL : $FAIL"
echo

if [[ "$FAIL" -eq 0 ]]; then
  echo "🟢 MEMOLIB — GO"
  echo
  echo "Le code passe les contrôles critiques."
  echo "Prochaine étape : test Stripe bout-en-bout en environnement TEST."
  exit 0
else
  echo "🔴 MEMOLIB — NO-GO"
  echo
  echo "Corriger les FAIL avant tout lancement réel."
  exit 1
fi
