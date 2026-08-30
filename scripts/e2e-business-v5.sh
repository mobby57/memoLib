#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-http://127.0.0.1:3000}"
T="${T:-15}"
COOKIE="${COOKIE:-/tmp/memolib-e2e-v5.cookies}"

EMAIL="e2e-v5-$(date +%s)-$$@example.com"
PASSWORD="${PASSWORD:-TestPassword123!}"
CLIENT_EMAIL="client-v5-$(date +%s)-$$@example.com"

PDF="/tmp/memolib-e2e-v5.pdf"

PASS=0
FAIL=0

ok() {
  printf "✅ %-24s %s\n" "$1" "${2:-}"
  PASS=$((PASS + 1))
}

fail() {
  printf "❌ %-24s %s\n" "$1" "${2:-}"
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

cleanup() {
  rm -f "$PDF"
}
trap cleanup EXIT

echo "============================================================"
echo " memoLib E2E BUSINESS V5"
echo "============================================================"
echo "BASE=$BASE"
echo "EMAIL=$EMAIL"
echo

rm -f "$COOKIE"

# ------------------------------------------------------------
# 1. REGISTER
# ------------------------------------------------------------
echo "--- 1. REGISTER ---"

REGISTER=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"prenom\":\"E2E\",
    \"nom\":\"Business\",
    \"email\":\"$EMAIL\",
    \"password\":\"$PASSWORD\"
  }" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/register")

USER_ID=$(jq -r '.user.id // empty' <<<"$REGISTER")
TENANT_ID=$(jq -r '.tenant.id // empty' <<<"$REGISTER")

if [ -n "$USER_ID" ] && [ -n "$TENANT_ID" ]; then
  ok "register" "tenant=$TENANT_ID"
else
  fail "register" "$REGISTER"
  exit 1
fi

# ------------------------------------------------------------
# 2. CSRF
# ------------------------------------------------------------
echo
echo "--- 2. LOGIN ---"

CSRF_JSON=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/csrf")

CSRF=$(jq -r '.csrfToken // empty' <<<"$CSRF_JSON")

if [ -z "$CSRF" ]; then
  fail "csrf" "$CSRF_JSON"
  exit 1
fi

LOGIN=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -X POST \
  -d "csrfToken=$CSRF&email=$EMAIL&password=$PASSWORD&json=true" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/callback/credentials")

if grep -q '"url"' <<<"$LOGIN"; then
  ok "login"
else
  fail "login" "$LOGIN"
  exit 1
fi

# ------------------------------------------------------------
# 3. SESSION
# ------------------------------------------------------------
echo
echo "--- 3. SESSION ---"

SESSION=$(request_json "$BASE/api/auth/session")
SESSION_TENANT=$(jq -r '.user.tenantId // empty' <<<"$SESSION")

if [ "$SESSION_TENANT" = "$TENANT_ID" ]; then
  ok "session" "tenant=$SESSION_TENANT"
else
  fail "session" "$SESSION"
  exit 1
fi

# ------------------------------------------------------------
# 4. CLIENT
# ------------------------------------------------------------
echo
echo "--- 4. CLIENT ---"

CLIENT=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"firstName\":\"Jean\",
    \"lastName\":\"BusinessV5\",
    \"email\":\"$CLIENT_EMAIL\"
  }" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/clients")

CLIENT_ID=$(jq -r '.client.id // empty' <<<"$CLIENT")

if [[ "$CLIENT_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "client" "$CLIENT_ID"
else
  fail "client" "$CLIENT"
  exit 1
fi

# ------------------------------------------------------------
# 5. DOSSIER
# ------------------------------------------------------------
echo
echo "--- 5. DOSSIER ---"

DOSSIER=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"clientId\":\"$CLIENT_ID\",
    \"titre\":\"Dossier Business V5\",
    \"type\":\"civil\",
    \"description\":\"Parcours métier V5\"
  }" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/dossiers")

DOSSIER_ID=$(jq -r '.dossier.id // empty' <<<"$DOSSIER")

if [[ "$DOSSIER_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "dossier" "$DOSSIER_ID"
else
  fail "dossier" "$DOSSIER"
  exit 1
fi

# ------------------------------------------------------------
# 6. DOCUMENT
# ------------------------------------------------------------
echo
echo "--- 6. DOCUMENT ---"

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
  '%%EOF' > "$PDF"

UPLOAD=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  -F "file=@$PDF;type=application/pdf" \
  -F "dossierId=$DOSSIER_ID" \
  -F "type=piece" \
  -F "description=Pièce métier V5" \
  "$BASE/api/documents/upload")

DOCUMENT_ID=$(jq -r '.document.id // empty' <<<"$UPLOAD")

if [[ "$DOCUMENT_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "document upload" "$DOCUMENT_ID"
else
  fail "document upload" "$UPLOAD"
  exit 1
fi

# ------------------------------------------------------------
# 7. DOCUMENT CLEAN
# ------------------------------------------------------------
echo
echo "--- 7. ANTIVIRUS ---"

DOCS=$(request_json \
  "$BASE/api/documents/upload?dossierId=$DOSSIER_ID")

AV_STATUS=$(jq -r --arg id "$DOCUMENT_ID" \
  '.documents[] | select(.id == $id) | .antivirusStatus' \
  <<<"$DOCS")

if [ "$AV_STATUS" = "CLEAN" ]; then
  ok "antivirus" "CLEAN"
else
  fail "antivirus" "status=${AV_STATUS:-missing}"
fi

# ------------------------------------------------------------
# 8. LEGAL DEADLINE
# ------------------------------------------------------------
echo
echo "--- 8. LEGAL DEADLINE ---"

REFERENCE_DATE=$(date -u +"%Y-%m-%dT00:00:00.000Z")

DEADLINE=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -b "$COOKIE" \
  -c "$COOKIE" \
  -d "{
    \"dossierId\":\"$DOSSIER_ID\",
    \"clientId\":\"$CLIENT_ID\",
    \"type\":\"CUSTOM\",
    \"label\":\"Échéance E2E V5\",
    \"referenceDate\":\"$REFERENCE_DATE\",
    \"legalDays\":30,
    \"legalBasis\":\"E2E V5\"
  }" \
  "$BASE/api/legal-deadlines")

DEADLINE_ID=$(jq -r '.deadline.id // empty' <<<"$DEADLINE")

if [[ "$DEADLINE_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "legal deadline" "$DEADLINE_ID"
else
  fail "legal deadline" "$DEADLINE"
fi

# ------------------------------------------------------------
# 9. DOSSIER ISOLATION
# ------------------------------------------------------------
echo
echo "--- 9. TENANT ISOLATION ---"

OTHER_ID="00000000-0000-0000-0000-000000000000"

OTHER=$(curl -sS \
  --connect-timeout 2 \
  --max-time "$T" \
  -b "$COOKIE" \
  "$BASE/api/dossiers/$OTHER_ID" || true)

if jq -e '.error' >/dev/null 2>&1 <<<"$OTHER"; then
  ok "tenant isolation" "foreign dossier rejected"
else
  fail "tenant isolation" "$OTHER"
fi

# ------------------------------------------------------------
# 10. FINAL SESSION
# ------------------------------------------------------------
echo
echo "--- 10. FINAL SESSION ---"

FINAL_SESSION=$(request_json "$BASE/api/auth/session")
FINAL_ID=$(jq -r '.user.id // empty' <<<"$FINAL_SESSION")

if [ "$FINAL_ID" = "$USER_ID" ]; then
  ok "final session" "$FINAL_ID"
else
  fail "final session" "$FINAL_SESSION"
fi

echo
echo "============================================================"
echo " PASS=$PASS FAIL=$FAIL"
echo "============================================================"

if [ "$FAIL" -eq 0 ]; then
  echo "✅ E2E BUSINESS V5 GREEN"
  exit 0
else
  echo "❌ E2E BUSINESS V5 FAILED"
  exit 1
fi
