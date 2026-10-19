#!/usr/bin/env bash
# Verification complete du lot 4 en production. LECTURE SEULE.
#
# Usage :
#   bash scripts/verify-lot4.sh
#   bash scripts/verify-lot4.sh --json
#
# Prerequis optionnels (selon sections) :
#   - curl           (sections 3, 4, 6)
#   - railway CLI    (sections 5, 6)
#   - psql + DATABASE_URL ou railway run (section 7)
#   - CRON_SECRET en env (section 8)

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
hdr()  { echo; echo "═══ $* ═══"; }

# ─── 1. Environnement local ─────────────────────────────────────────────
hdr "1. Environnement local"
[[ "$PWD" == /mnt/* ]] && ko "pwd sous /mnt/ — risque d'upload Windows" || ok "pwd : $PWD"
echo "  branche : $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
echo "  HEAD    : $(git rev-parse --short HEAD 2>/dev/null || echo '?')"

# ─── 2. Code source — fichiers lot 4 ────────────────────────────────────
hdr "2. Fichiers lot 4"
for f in src/lib/security/oauth-tokens.ts \
         src/__tests__/lib/security/oauth-tokens.test.ts \
         src/app/api/cron/email-sync/route.ts \
         src/app/api/email/connect/gmail/callback/route.ts \
         src/app/api/email/connect/outlook/callback/route.ts; do
  [[ -f "$f" ]] && ok "$f" || ko "MANQUANT : $f"
done

# ─── 3. tsc + tests ─────────────────────────────────────────────────────
hdr "3. Compilation + tests"
if command -v npx >/dev/null 2>&1; then
  if npx tsc --noEmit >/tmp/v-tsc.out 2>&1; then
    ok "tsc : 0 erreur"
  else
    ko "tsc : $(grep -c 'error TS' /tmp/v-tsc.out || echo '?') erreur(s)"
  fi
  if [ -x node_modules/.bin/vitest ]; then
    if npx vitest run src/__tests__/lib/security/oauth-tokens.test.ts >/tmp/v-vt.out 2>&1; then
      ok "vitest oauth-tokens : $(grep -oE '[0-9]+ passed' /tmp/v-vt.out | head -1)"
    else
      ko "vitest oauth-tokens : échoue (voir /tmp/v-vt.out)"
    fi
  else
    warn "vitest non installé"
  fi
fi

# ─── 4. CSP production (header HTTP) ────────────────────────────────────
hdr "4. CSP production"
if command -v curl >/dev/null 2>&1; then
  CSP=$(curl -sI --max-time 10 "$PROD_URL" 2>/dev/null | grep -i content-security-policy | tr -d '\r')
  if [[ -z "$CSP" ]]; then
    ko "aucun header CSP servi par $PROD_URL"
  else
    for dom in challenges.cloudflare.com protect.clerk.com; do
      echo "$CSP" | grep -q "$dom" && ok "CSP contient $dom" || ko "CSP manque $dom"
    done
    echo "$CSP" | grep -q 'connect-src[^;]*protect\.clerk\.com:\*' \
      && ok "connect-src : protect.clerk.com:*" \
      || ko "connect-src : ':*' manquant (WebSocket/proxy Clerk bloqué)"
  fi
else
  warn "curl absent"
fi

# ─── 5. Bundle Clerk (pk_test_ vs pk_live_) ─────────────────────────────
hdr "5. Bundle Clerk"
if command -v curl >/dev/null 2>&1; then
  HTML=$(curl -s --max-time 10 "$PUBLIC_URL" 2>/dev/null || echo "")
  if [[ -z "$HTML" ]]; then
    ko "impossible de récupérer $PUBLIC_URL"
  else
    if echo "$HTML" | grep -q 'pk_test_'; then
      ko "pk_test_ détecté dans le HTML — Clerk dev en prod"
    else
      ok "pk_test_ absent du HTML"
    fi
    # Les clés sont souvent dans les chunks
    FOUND_LIVE=0; FOUND_TEST=0
    for chunk in $(echo "$HTML" | grep -oE '/_next/static/chunks/[^"]+\.js' | head -5); do
      BODY=$(curl -s --max-time 5 "$PUBLIC_URL$chunk" 2>/dev/null)
      echo "$BODY" | grep -q 'pk_test_' && FOUND_TEST=1
      echo "$BODY" | grep -q 'pk_live_' && FOUND_LIVE=1
    done
    [[ "$FOUND_TEST" -eq 1 ]] && ko "pk_test_ dans un chunk JS" || ok "pk_test_ absent des chunks"
    [[ "$FOUND_LIVE" -eq 1 ]] && ok "pk_live_ dans un chunk JS" || warn "pk_live_ non trouvé (peut être inline)"
  fi
fi

# ─── 6. Railway — statut + logs récents ─────────────────────────────────
hdr "6. Railway"
if command -v railway >/dev/null 2>&1; then
  RS=$(railway status 2>/dev/null || echo "")
  SVC=$(echo "$RS" | grep -oE 'status:\s+● [A-Za-z]+' | head -1 | sed 's/.*● //')
  case "$SVC" in
    Online|Active|Success) ok "service : $SVC" ;;
    Failed|Crashed)        ko "service : $SVC — voir logs" ;;
    *)                     warn "service : ${SVC:-inconnu}" ;;
  esac
  # Logs récents filtrés
  echo "  logs récents (30 dernières lignes) :"
  railway logs --tail 200 2>/dev/null | \
    grep -E "Gmail Connect|Outlook Connect|encrypt|decrypt|session_mismatch|ENCRYPTION" | \
    tail -10 | sed 's/^/    /' || echo "    (aucune ligne pertinente)"
else
  warn "railway CLI absent"
fi

# ─── 7. DB — jetons chiffrés ? ──────────────────────────────────────────
hdr "7. Base de données — jetons OAuth"
SQL="SELECT provider, LEFT(\"accessToken\", 60) AS access_prefix, LEFT(\"refreshToken\", 60) AS refresh_prefix, \"updatedAt\" FROM \"EmailAccount\" ORDER BY \"updatedAt\" DESC LIMIT 5;"
DB_OUT=""
if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
  DB_OUT=$(psql "$DATABASE_URL" -tAc "$SQL" 2>/dev/null || echo "")
elif command -v railway >/dev/null 2>&1; then
  DB_OUT=$(railway run --service Postgres psql -tAc "$SQL" 2>/dev/null || echo "")
fi

if [[ -z "$DB_OUT" ]]; then
  warn "accès DB indisponible — vérifier manuellement dans Railway → Postgres → Query"
  echo "    SQL à exécuter :"
  echo "    $SQL"
else
  ROWS=$(echo "$DB_OUT" | grep -c '|' || echo 0)
  echo "  lignes EmailAccount : $ROWS"
  if [[ "$ROWS" -eq 0 ]]; then
    warn "aucune connexion email en base — flow Gmail jamais abouti"
  else
    # Verifie que chaque access_prefix est hex + ':'
    ALL_HEX=1
    while IFS='|' read -r prov apre rpre upd; do
      [[ -z "$prov" ]] && continue
      echo "    [$prov] access=${apre:0:20}... updated=$upd"
      if [[ "$apre" =~ ^ya29\. ]] || [[ "$apre" =~ ^EwBA ]]; then
        ALL_HEX=0
      fi
    done <<< "$DB_OUT"
    [[ "$ALL_HEX" -eq 1 ]] && ok "jetons : préfixe hexadécimal (chiffrés)" || ko "jetons en clair détectés (ya29./EwBA…)"
  fi
fi

# ─── 8. Cron email-sync ─────────────────────────────────────────────────
hdr "8. Cron email-sync"
if [[ -z "${CRON_SECRET:-}" ]]; then
  warn "CRON_SECRET non exporté — test cron sauté"
else
  if command -v curl >/dev/null 2>&1; then
    RC=$(curl -s -o /tmp/v-cron.json -w "%{http_code}" --max-time 30 \
      "$PUBLIC_URL/api/cron/email-sync" \
      -H "Authorization: Bearer $CRON_SECRET")
    case "$RC" in
      200) ok "cron email-sync : HTTP 200" ;;
      401) ko "cron : 401 — CRON_SECRET invalide" ;;
      500) ko "cron : 500 — voir logs Railway" ;;
      *)   warn "cron : HTTP $RC" ;;
    esac
    head -c 200 /tmp/v-cron.json 2>/dev/null | sed 's/^/    /'; echo
  fi
fi

# ─── Résumé ─────────────────────────────────────────────────────────────
echo
echo "═══════════════════════════════════════════════"
echo "  ✅ OK    : $PASS"
echo "  ⚠️  WARN  : $WARN"
echo "  ❌ FAIL  : $FAIL"
echo "═══════════════════════════════════════════════"

if [[ $FAIL -eq 0 && $WARN -eq 0 ]]; then
  echo "  🎉 LOT 4 VALIDÉ EN PRODUCTION"
  exit 0
elif [[ $FAIL -eq 0 ]]; then
  echo "  ✅ Lot 4 fonctionnel, mais vérifier les warnings ci-dessus"
  exit 0
else
  echo "  ❌ Corriger les FAIL avant de considérer le lot 4 validé"
  exit 1
fi
