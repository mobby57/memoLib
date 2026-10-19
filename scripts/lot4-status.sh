#!/usr/bin/env bash
# Audit complet de l'etat lot 4 + Clerk prod.
# Lecture seule : ne modifie rien, ne deploie rien.
#
# Usage :
#   bash scripts/lot4-status.sh
#   bash scripts/lot4-status.sh --json   # sortie machine (si jq dispo)

set -uo pipefail
cd "$(dirname "$0")/.."

JSON=0
[[ "${1:-}" == "--json" ]] && JSON=1

PROD_URL="https://memolib-production-6786.up.railway.app"
PUBLIC_URL="https://memolib.space"
PASS=0; FAIL=0; WARN=0

ok()   { echo "  ✅ $*"; PASS=$((PASS+1)); }
ko()   { echo "  ❌ $*"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  $*"; WARN=$((WARN+1)); }
hdr()  { echo; echo "== $* =="; }

hdr "1. Environnement local"
echo "  pwd    : $(pwd)"
echo "  branche: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
echo "  HEAD   : $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
if [[ "$PWD" == /mnt/* ]]; then
  ko "pwd est sous /mnt/ — risque d'upload Windows vers Railway"
else
  ok "pwd correct (Linux)"
fi

hdr "2. Fichiers critiques"
for f in next.config.js src/lib/security/oauth-tokens.ts \
         src/app/api/cron/email-sync/route.ts \
         src/app/api/email/connect/gmail/callback/route.ts \
         src/app/api/email/connect/outlook/callback/route.ts; do
  [[ -f "$f" ]] && ok "présent : $f" || ko "MANQUANT : $f"
done

hdr "3. CSP local (next.config.js)"
CSP_CHALLENGES=$(grep -c 'challenges\.cloudflare\.com' next.config.js 2>/dev/null || echo 0)
CSP_PROTECT=$(grep -c 'protect\.clerk\.com' next.config.js 2>/dev/null || echo 0)
echo "  occurrences challenges.cloudflare.com : $CSP_CHALLENGES"
echo "  occurrences protect.clerk.com         : $CSP_PROTECT"
[[ "$CSP_CHALLENGES" -ge 2 && "$CSP_PROTECT" -ge 6 ]] && ok "CSP locale complète" || ko "CSP locale incomplète"
grep -o "style-src[^;]*;" next.config.js 2>/dev/null | head -2 | sed 's/^/    /'

hdr "4. oauth-tokens helpers"
grep -q 'export function encryptToken' src/lib/security/oauth-tokens.ts 2>/dev/null && ok "encryptToken exporté" || ko "encryptToken manquant"
grep -q 'export function decryptToken' src/lib/security/oauth-tokens.ts 2>/dev/null && ok "decryptToken exporté" || ko "decryptToken manquant"
grep -q "if (!isEncryptedToken(valeur)) return valeur" src/lib/security/oauth-tokens.ts 2>/dev/null && ok "passthrough clair présent" || warn "passthrough clair non détecté (vérifier manuellement)"

hdr "5. tsc"
if command -v npx >/dev/null 2>&1; then
  if npx tsc --noEmit >/tmp/tsc.out 2>&1; then
    ok "tsc : 0 erreur"
  else
    ERR=$(grep -c 'error TS' /tmp/tsc.out || echo '?')
    ko "tsc : $ERR erreur(s) — voir /tmp/tsc.out"
  fi
else
  warn "npx absent, tsc non vérifié"
fi

hdr "6. Tests oauth-tokens"
if command -v npx >/dev/null 2>&1 && [ -f node_modules/.bin/vitest ]; then
  if npx vitest run src/__tests__/lib/security/oauth-tokens.test.ts >/tmp/vt.out 2>&1; then
    N=$(grep -oE '[0-9]+ passed' /tmp/vt.out | head -1 || echo '?')
    ok "vitest : $N"
  else
    ko "vitest échoue — voir /tmp/vt.out"
  fi
else
  warn "vitest non disponible"
fi

hdr "7. Railway CLI"
if command -v railway >/dev/null 2>&1; then
  RS=$(railway status 2>/dev/null || echo "erreur")
  SVC_STATUS=$(echo "$RS" | grep -oE 'status:\s+● [A-Za-z]+' | head -1 | sed 's/.*● //')
  echo "  statut service : ${SVC_STATUS:-inconnu}"
  case "$SVC_STATUS" in
    Online|Active|Success) ok "service Railway en ligne" ;;
    Failed|Crashed)        ko "service Railway $SVC_STATUS — consulter les logs" ;;
    *)                     warn "statut Railway : $SVC_STATUS" ;;
  esac
else
  warn "railway CLI absent, déploiement non vérifié"
fi

hdr "8. Headers HTTP prod (Railway direct)"
if command -v curl >/dev/null 2>&1; then
  CSP=$(curl -sI --max-time 10 "$PROD_URL" 2>/dev/null | grep -i content-security-policy | tr -d '\r')
  if [[ -z "$CSP" ]]; then
    ko "aucun header CSP servi par $PROD_URL"
  else
    echo "$CSP" | tr ';' '\n' | sed -n 's/^ */    /p' | grep -E 'script-src|style-src|connect-src|frame-src' | head -6
    echo "$CSP" | grep -q 'challenges\.cloudflare\.com' && ok "CSP prod : challenges.cloudflare.com" || ko "CSP prod : challenges.cloudflare.com manquant"
    echo "$CSP" | grep -q 'protect\.clerk\.com'        && ok "CSP prod : protect.clerk.com"        || ko "CSP prod : protect.clerk.com manquant"
  fi
else
  warn "curl absent"
fi

hdr "9. Bundle Clerk servi (pk_test_ vs pk_live_)"
if command -v curl >/dev/null 2>&1; then
  HTML=$(curl -s --max-time 10 "$PUBLIC_URL" 2>/dev/null || echo "")
  if [[ -z "$HTML" ]]; then
    ko "impossible de récupérer $PUBLIC_URL"
  else
    if echo "$HTML" | grep -q 'pk_test_'; then
      ko "bundle : pk_test_ détecté (Clerk dev en prod)"
    else
      ok "bundle : pk_test_ absent"
    fi
    if echo "$HTML" | grep -q 'pk_live_'; then
      ok "bundle : pk_live_ détecté"
    else
      warn "bundle : pk_live_ non détecté dans le HTML initial (peut être dans un chunk JS)"
    fi
  fi
fi

hdr "10. git status"
DIRTY=$(git status --short 2>/dev/null | wc -l)
if [[ "$DIRTY" -eq 0 ]]; then
  ok "working tree propre"
else
  warn "$DIRTY entrée(s) non commitées — un railway up les embarquera"
  git status --short 2>/dev/null | head -20 | sed 's/^/    /'
fi

echo
echo "==================== RÉSUMÉ ===================="
echo "  ✅ OK    : $PASS"
echo "  ⚠️  WARN  : $WARN"
echo "  ❌ FAIL  : $FAIL"
echo "==============================================="

if [[ $FAIL -gt 0 ]]; then
  echo
  echo "Prochaines actions prioritaires :"
  echo "  1. Corriger les ❌ ci-dessus dans l'ordre"
  echo "  2. Ne PAS railway up tant que working tree contient un fichier en M qui crashe au boot"
  echo "  3. Après fix : railway up depuis ~/projects/memolib, PAS /mnt/c/..."
fi

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
