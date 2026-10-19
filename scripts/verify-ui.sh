#!/usr/bin/env bash
# Diagnostic des problemes UI restants. LECTURE SEULE.

set -uo pipefail
cd "$(dirname "$0")/.."

PUBLIC_URL="https://memolib.space"
WS_URL="${NEXT_PUBLIC_WS_URL:-}"
PASS=0; FAIL=0; WARN=0
ok()   { echo "  ✅ $*"; PASS=$((PASS+1)); }
ko()   { echo "  ❌ $*"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  $*"; WARN=$((WARN+1)); }
hdr()  { echo; echo "═══ $* ═══"; }

# ── A. WebSocket ──────────────────────────────────────────────────
hdr "A. WebSocket (notifications/chat temps reel)"
if [[ -n "$WS_URL" ]]; then
  ok "NEXT_PUBLIC_WS_URL défini : $WS_URL"
else
  ko "NEXT_PUBLIC_WS_URL absent → fallback cassé vers /api/socket/"
fi

# Cherche l'URL WS dans le bundle
HTML=$(curl -s --max-time 10 "$PUBLIC_URL" 2>/dev/null || echo "")
if [[ -n "$HTML" ]]; then
  WS_IN_BUNDLE=$(echo "$HTML" | grep -oE 'wss?://[^"'"'"' ]+' | head -3)
  if [[ -n "$WS_IN_BUNDLE" ]]; then
    echo "  URLs WS dans le HTML :"
    echo "$WS_IN_BUNDLE" | sed 's/^/    /'
    echo "$WS_IN_BUNDLE" | grep -q "/api/socket/" && \
      ko "le bundle pointe vers /api/socket/ (cassé)" || \
      ok "le bundle pointe vers un serveur WS dédié"
  else
    warn "aucune URL WS dans le HTML initial (probablement dans un chunk)"
  fi
fi

# Test connectivité du serveur WS Railway
if command -v railway >/dev/null 2>&1; then
  WS_SVC=$(railway status 2>/dev/null | grep -iE 'websocket' | head -1)
  if [[ -n "$WS_SVC" ]]; then
    echo "  service Railway :"
    echo "    $WS_SVC" | sed 's/^/    /'
    echo "$WS_SVC" | grep -q 'Online' && ok "websocket-server Online" || ko "websocket-server pas Online"
  else
    warn "aucun service 'websocket' dans railway status"
  fi
fi

# ── B. Clerk bundle ───────────────────────────────────────────────
hdr "B. Bundle Clerk (pk_test_ vs pk_live_)"
if echo "$HTML" | grep -q 'pk_test_'; then
  ko "pk_test_ dans le HTML → Clerk dev en prod"
else
  ok "pk_test_ absent du HTML"
fi
# Test dans les chunks
FOUND_TEST=0
for chunk in $(echo "$HTML" | grep -oE '/_next/static/chunks/[^"]+\.js' | head -5); do
  BODY=$(curl -s --max-time 5 "$PUBLIC_URL$chunk" 2>/dev/null)
  echo "$BODY" | grep -q 'pk_test_' && FOUND_TEST=1
done
[[ "$FOUND_TEST" -eq 1 ]] && ko "pk_test_ dans un chunk JS" || ok "pk_test_ absent des chunks"

# ── C. CAPTCHA Turnstile ──────────────────────────────────────────
hdr "C. CAPTCHA Turnstile (Clerk)"
CSP=$(curl -sI --max-time 10 "$PUBLIC_URL" 2>/dev/null | grep -i content-security-policy | tr -d '\r')
echo "$CSP" | grep -q 'challenges\.cloudflare\.com' && ok "CSP autorise Turnstile" || ko "CSP bloque Turnstile"
echo "  → Pour activer le CAPTCHA : Clerk Dashboard → Protect → Rules → activer 'Bot sign-up protection'"

# ── D. Webhook Clerk ──────────────────────────────────────────────
hdr "D. Webhook Clerk (signup nouveaux clients)"
WH_FILE="src/app/api/webhooks/clerk/route.ts"
if [[ -f "$WH_FILE" ]]; then
  if grep -q "const { type, data } = evt;" "$WH_FILE" && \
     ! grep -q "if (!evt" "$WH_FILE"; then
    ko "webhook sans garde sur evt → crash si evt undefined"
    echo "    Correctif : ajouter avant la déstructuration :"
    echo "      if (!evt || typeof evt !== 'object') {"
    echo "        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });"
    echo "      }"
  else
    ok "webhook avec garde (ou fichier modifié depuis)"
  fi
else
  warn "fichier $WH_FILE introuvable"
fi

# ── Résumé ────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════"
echo "  ✅ OK    : $PASS"
echo "  ⚠️  WARN  : $WARN"
echo "  ❌ FAIL  : $FAIL"
echo "════════════════════════════════════════"

if [[ $FAIL -gt 0 ]]; then
  echo
  echo "Actions prioritaires :"
  echo "  A (WS)     : ajouter NEXT_PUBLIC_WS_URL dans Railway → Variables"
  echo "  B (Clerk)  : remplacer pk_test_ par pk_live_ dans Railway → Variables"
  echo "  C (CAPTCHA): activer Bot protection dans Clerk Dashboard → Protect"
  echo "  D (Webhook): ajouter la garde sur evt dans clerk/route.ts"
  exit 1
fi
