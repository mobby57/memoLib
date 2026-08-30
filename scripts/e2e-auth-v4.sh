#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-http://127.0.0.1:3000}"
T="${T:-15}"
COOKIE="${COOKIE:-/tmp/memolib-e2e-v4.cookies}"
EMAIL="e2e-$(date +%s)-$$@example.com"
PASSWORD="${PASSWORD:-TestPassword123!}"

TMP_PDF="/tmp/memolib-e2e-v4.pdf"

PASS=0
FAIL=0

cleanup() {
  rm -f "$TMP_PDF"
}
trap cleanup EXIT

ok() {
  printf "✅ %-20s %s\n" "$1" "${2:-}"
  PASS=$((PASS + 1))
}

fail() {
  printf "❌ %-20s %s\n" "$1" "${2:-}"
  FAIL=$((FAIL + 1))
}

request_json() {
  curl -sS \
    --connect-timeout 2 \
    --max-time "$T" \
    -b "$COOKIE" \
    -c "$COOKIE" \
    "$@"
}

require_json_field() {
  local json="$1"
  local expr="$2"
  jq -e "$expr" >/dev/null 2>&1 <<<"$json"
}

echo "============================================================"
echo " memoLib E2E AUTH V4"
echo "============================================================"
echo "BASE   = $BASE"
echo "EMAIL  = $EMAIL"
echo "COOKIE = $COOKIE"
echo

rm -f "$COOKIE"

# ------------------------------------------------------------
# Health
# ------------------------------------------------------------
echo "--- 1. HEALTH ---"

HEALTH=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  "$BASE/api/health" || true)

if require_json_field "$HEALTH" '.status == "healthy"'; then
  ok "health" "healthy"
else
  fail "health" "$HEALTH"
fi

# ------------------------------------------------------------
# Register
# ------------------------------------------------------------
echo
echo "--- 2. REGISTER ---"

REGISTER=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"prenom\":\"E2E\",
    \"nom\":\"Test\",
    \"email\":\"$EMAIL\",
    \"password\":\"$PASSWORD\"
  }" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/register" || true)

USER_ID=$(jq -r '.user.id // empty' <<<"$REGISTER")
TENANT_ID=$(jq -r '.tenant.id // empty' <<<"$REGISTER")

if [ -n "$USER_ID" ] && [ -n "$TENANT_ID" ]; then
  ok "register" "user=$USER_ID tenant=$TENANT_ID"
else
  fail "register" "$REGISTER"
  exit 1
fi

# ------------------------------------------------------------
# CSRF
# ------------------------------------------------------------
echo
echo "--- 3. CSRF ---"

CSRF_JSON=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/csrf" || true)

CSRF=$(jq -r '.csrfToken // empty' <<<"$CSRF_JSON")

if [ -n "$CSRF" ]; then
  ok "csrf"
else
  fail "csrf" "$CSRF_JSON"
  exit 1
fi

# ------------------------------------------------------------
# Login
# ------------------------------------------------------------
echo
echo "--- 4. LOGIN ---"

LOGIN=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -X POST \
  -d "csrfToken=$CSRF&email=$EMAIL&password=$PASSWORD&json=true" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/callback/credentials" || true)

if grep -q '"url"' <<<"$LOGIN"; then
  ok "login"
else
  fail "login" "$LOGIN"
  exit 1
fi

# ------------------------------------------------------------
# Session
# ------------------------------------------------------------
echo
echo "--- 5. SESSION ---"

SESSION=$(request_json "$BASE/api/auth/session" || true)

SESSION_USER_ID=$(jq -r '.user.id // empty' <<<"$SESSION")
SESSION_TENANT_ID=$(jq -r '.user.tenantId // empty' <<<"$SESSION")

if [ -n "$SESSION_USER_ID" ] && [ "$SESSION_USER_ID" = "$USER_ID" ] &&
   [ "$SESSION_TENANT_ID" = "$TENANT_ID" ]; then
  ok "session" "user=$SESSION_USER_ID tenant=$SESSION_TENANT_ID"
else
  fail "session" "$SESSION"
  exit 1
fi

# ------------------------------------------------------------
# Create client
# ------------------------------------------------------------
echo
echo "--- 6. CREATE CLIENT ---"

CLIENT_EMAIL="client-e2e-$(date +%s)-$$@example.com"

CLIENT=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"firstName\":\"Jean\",
    \"lastName\":\"E2E\",
    \"email\":\"$CLIENT_EMAIL\"
  }" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/clients" || true)

CLIENT_ID=$(jq -r '.client.id // empty' <<<"$CLIENT")

if [[ "$CLIENT_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "client" "$CLIENT_ID"
else
  fail "client" "$CLIENT"
  exit 1
fi

# ------------------------------------------------------------
# Create dossier
# ------------------------------------------------------------
echo
echo "--- 7. CREATE DOSSIER ---"

DOSSIER=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"clientId\":\"$CLIENT_ID\",
    \"titre\":\"Dossier E2E\",
    \"type\":\"civil\",
    \"description\":\"Dossier créé automatiquement par E2E V4\"
  }" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/dossiers" || true)

DOSSIER_ID=$(jq -r '.dossier.id // empty' <<<"$DOSSIER")

if [[ "$DOSSIER_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "dossier" "$DOSSIER_ID"
else
  fail "dossier" "$DOSSIER"
  exit 1
fi

# ------------------------------------------------------------
# List dossiers
# ------------------------------------------------------------
echo
echo "--- 8. LIST DOSSIERS ---"

DOSSIERS=$(request_json "$BASE/api/dossiers" || true)
TOTAL_DOSSIERS=$(jq -r '.total // -1' <<<"$DOSSIERS")

if [ "$TOTAL_DOSSIERS" -ge 1 ] 2>/dev/null &&
   jq -e --arg id "$DOSSIER_ID" '.dossiers | any(.id == $id)' >/dev/null 2>&1 <<<"$DOSSIERS"; then
  ok "list dossiers" "total=$TOTAL_DOSSIERS"
else
  fail "list dossiers" "$DOSSIERS"
  exit 1
fi

# ------------------------------------------------------------
# List documents before
# ------------------------------------------------------------
echo
echo "--- 9. DOCUMENTS BEFORE ---"

DOCS_BEFORE=$(request_json \
  "$BASE/api/documents/upload?dossierId=$DOSSIER_ID" || true)

TOTAL_BEFORE=$(jq -r '.total // -1' <<<"$DOCS_BEFORE")

if [ "$TOTAL_BEFORE" -ge 0 ] 2>/dev/null; then
  ok "documents before" "total=$TOTAL_BEFORE"
else
  fail "documents before" "$DOCS_BEFORE"
  exit 1
fi

# ------------------------------------------------------------
# Generate PDF
# ------------------------------------------------------------
echo
echo "--- 10. TEST PDF ---"

printf '%s\n' \
  '%PDF-1.4' \
  '1 0 obj' \
  '<< /Type /Catalog /Pages 2 0 R >>' \
  'endobj' \
  '2 0 obj' \
  '<< /Type /Pages /Kids [] /Count 0 >>' \
  'endobj' \
  'xref' \
  '0 3' \
  '0000000000 65535 f ' \
  '0000000009 00000 n ' \
  '0000000058 00000 n ' \
  'trailer' \
  '<< /Size 3 /Root 1 0 R >>' \
  'startxref' \
  '107' \
  '%%EOF' > "$TMP_PDF"

if [ -s "$TMP_PDF" ]; then
  ok "test pdf" "$(stat -c '%s bytes' "$TMP_PDF")"
else
  fail "test pdf"
  exit 1
fi

# ------------------------------------------------------------
# Upload
# ------------------------------------------------------------
echo
echo "--- 11. UPLOAD DOCUMENT ---"

UPLOAD=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  -F "file=@$TMP_PDF;type=application/pdf" \
  -F "dossierId=$DOSSIER_ID" \
  -F "type=piece" \
  -F "description=Document E2E V4" \
  "$BASE/api/documents/upload" || true)

DOCUMENT_ID=$(jq -r '.document.id // empty' <<<"$UPLOAD")

if [[ "$DOCUMENT_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "upload" "$DOCUMENT_ID"
else
  fail "upload" "$UPLOAD"
  exit 1
fi

# ------------------------------------------------------------
# List documents after
# ------------------------------------------------------------
echo
echo "--- 12. DOCUMENTS AFTER ---"

DOCS_AFTER=$(request_json \
  "$BASE/api/documents/upload?dossierId=$DOSSIER_ID" || true)

TOTAL_AFTER=$(jq -r '.total // -1' <<<"$DOCS_AFTER")
STATUS=$(jq -r --arg id "$DOCUMENT_ID" \
  '.documents[] | select(.id == $id) | .antivirusStatus' \
  <<<"$DOCS_AFTER" | head -n1)

if [ "$TOTAL_AFTER" -ge 1 ] 2>/dev/null &&
   jq -e --arg id "$DOCUMENT_ID" \
     '.documents | any(.id == $id)' >/dev/null 2>&1 <<<"$DOCS_AFTER"; then
  ok "documents after" "total=$TOTAL_AFTER status=${STATUS:-PENDING}"
else
  fail "documents after" "$DOCS_AFTER"
  exit 1
fi

# ------------------------------------------------------------
# Session stability
# ------------------------------------------------------------
echo
echo "--- 13. SESSION STABILITY ---"

SESSION_OK=0

for i in 1 2 3; do
  CODE=$(curl -sS \
    --connect-timeout 2 \
    --max-time "$T" \
    -o "/tmp/memolib-session-v4-$i.json" \
    -w '%{http_code}' \
    -b "$COOKIE" \
    "$BASE/api/auth/session" 2>/dev/null || true)

  echo "session-$i           HTTP $CODE"

  if [ "$CODE" = "200" ]; then
    SESSION_OK=$((SESSION_OK + 1))
  fi
done

if [ "$SESSION_OK" -eq 3 ]; then
  ok "session stability" "3/3 HTTP 200"
else
  fail "session stability" "$SESSION_OK/3"
fi

# ------------------------------------------------------------
# Documents unauthenticated
# ------------------------------------------------------------
echo
echo "--- 14. DOCUMENTS UNAUTH ---"

CODE=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -o /tmp/memolib-doc-v4-unauth.json \
  -w '%{http_code}' \
  "$BASE/api/documents/upload?dossierId=$DOSSIER_ID" 2>/dev/null || true)

if [ "$CODE" = "401" ]; then
  ok "documents unauth" "HTTP 401"
else
  fail "documents unauth" "HTTP $CODE"
fi

# ------------------------------------------------------------
# Summary
# ------------------------------------------------------------
echo
echo "============================================================"
echo " PASS=$PASS FAIL=$FAIL"
echo "============================================================"

if [ "$FAIL" -eq 0 ]; then
  echo "✅ E2E V4 GREEN"
  exit 0
else
  echo "❌ E2E V4 FAILED"
  exit 1
fi
