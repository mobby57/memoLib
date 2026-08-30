#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${BASE:-http://127.0.0.1:3000}"
T="${T:-15}"
COOKIE="${COOKIE:-/tmp/memolib-e2e-next.cookies}"

EMAIL="e2e-next-$(date +%s)-$$@example.com"
PASSWORD="${PASSWORD:-TestPassword123!}"
CLIENT_EMAIL="client-next-$(date +%s)-$$@example.com"

PDF="/tmp/memolib-e2e-next.pdf"

PASS=0
FAIL=0

ok() {
  printf "✅ %-28s %s\n" "$1" "${2:-}"
  PASS=$((PASS + 1))
}

fail() {
  printf "❌ %-28s %s\n" "$1" "${2:-}"
  FAIL=$((FAIL + 1))
}

request_json() {
  curl -sS     --connect-timeout 2     --max-time "$T"     -b "$COOKIE"     -c "$COOKIE"     "$@"
}

cleanup() {
  rm -f "$PDF"
}
trap cleanup EXIT

echo "============================================================"
echo " memoLib E2E BUSINESS NEXT"
echo "============================================================"
echo "BASE=$BASE"
echo "EMAIL=$EMAIL"
echo

rm -f "$COOKIE"

# ------------------------------------------------------------
# 1. REGISTER
# ------------------------------------------------------------
echo "--- 1. REGISTER ---"

REGISTER=$(curl -sS   --connect-timeout 2   --max-time "$T"   -H "Content-Type: application/json"   -X POST   -d "{
    \"prenom\":\"E2E\",
    \"nom\":\"BusinessNext\",
    \"email\":\"$EMAIL\",
    \"password\":\"$PASSWORD\"
  }"   -b "$COOKIE"   -c "$COOKIE"   "$BASE/api/auth/register")

USER_ID=$(jq -r '.user.id // empty' <<<"$REGISTER")
TENANT_ID=$(jq -r '.tenant.id // empty' <<<"$REGISTER")

if [ -n "$USER_ID" ] && [ -n "$TENANT_ID" ]; then
  ok "register" "tenant=$TENANT_ID"
else
  fail "register" "$REGISTER"
  exit 1
fi

# ------------------------------------------------------------
# 2. LOGIN / CSRF
# ------------------------------------------------------------
echo
echo "--- 2. LOGIN ---"

CSRF_JSON=$(curl -sS   --connect-timeout 2   --max-time "$T"   -b "$COOKIE"   -c "$COOKIE"   "$BASE/api/auth/csrf")

CSRF=$(jq -r '.csrfToken // empty' <<<"$CSRF_JSON")

if [ -z "$CSRF" ]; then
  fail "csrf" "$CSRF_JSON"
  exit 1
fi

LOGIN=$(curl -sS   --connect-timeout 2   --max-time "$T"   -H "Content-Type: application/x-www-form-urlencoded"   -X POST   -d "csrfToken=$CSRF&email=$EMAIL&password=$PASSWORD&json=true"   -b "$COOKIE"   -c "$COOKIE"   "$BASE/api/auth/callback/credentials")

if grep -q '"url"' <<<"$LOGIN"; then
  ok "login"
else
  fail "login" "$LOGIN"
  exit 1
fi

# ------------------------------------------------------------
# 3. SESSION / TENANT
# ------------------------------------------------------------
echo
echo "--- 3. SESSION ---"

SESSION=$(request_json "$BASE/api/auth/session")
SESSION_USER_ID=$(jq -r '.user.id // empty' <<<"$SESSION")
SESSION_TENANT=$(jq -r '.user.tenantId // empty' <<<"$SESSION")

if [ "$SESSION_USER_ID" = "$USER_ID" ] &&
   [ "$SESSION_TENANT" = "$TENANT_ID" ]; then
  ok "session" "user=$SESSION_USER_ID tenant=$SESSION_TENANT"
else
  fail "session" "$SESSION"
  exit 1
fi

# ------------------------------------------------------------
# 4. CLIENT
# ------------------------------------------------------------
echo
echo "--- 4. CLIENT ---"

CLIENT=$(curl -sS   --connect-timeout 2   --max-time "$T"   -H "Content-Type: application/json"   -X POST   -d "{
    \"firstName\":\"Jean\",
    \"lastName\":\"BusinessNext\",
    \"email\":\"$CLIENT_EMAIL\"
  }"   -b "$COOKIE"   -c "$COOKIE"   "$BASE/api/clients")

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

DOSSIER=$(curl -sS   --connect-timeout 2   --max-time "$T"   -H "Content-Type: application/json"   -X POST   -d "{
    \"clientId\":\"$CLIENT_ID\",
    \"titre\":\"Dossier Business NEXT\",
    \"type\":\"civil\",
    \"description\":\"Parcours métier NEXT\"
  }"   -b "$COOKIE"   -c "$COOKIE"   "$BASE/api/dossiers")

DOSSIER_ID=$(jq -r '.dossier.id // empty' <<<"$DOSSIER")

if [[ "$DOSSIER_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "dossier" "$DOSSIER_ID"
else
  fail "dossier" "$DOSSIER"
  exit 1
fi

# ------------------------------------------------------------
# 6. DOSSIER READ-BACK
# ------------------------------------------------------------
echo
echo "--- 6. DOSSIER READ-BACK ---"

DOSSIER_GET=$(request_json "$BASE/api/dossiers/$DOSSIER_ID")
READBACK_ID=$(jq -r '.dossier.id // empty' <<<"$DOSSIER_GET")
READBACK_CLIENT=$(jq -r '.dossier.clientId // empty' <<<"$DOSSIER_GET")

if [ "$READBACK_ID" = "$DOSSIER_ID" ] &&
   [ "$READBACK_CLIENT" = "$CLIENT_ID" ]; then
  ok "dossier read-back" "$READBACK_ID"
else
  fail "dossier read-back" "$DOSSIER_GET"
fi

# ------------------------------------------------------------
# 7. DOCUMENT
# ------------------------------------------------------------
echo
echo "--- 7. DOCUMENT ---"

printf '%s\n'   '%PDF-1.4'   '1 0 obj'   '<< /Type /Catalog /Pages 2 0 R >>'   'endobj'   '2 0 obj'   '<< /Type /Pages /Kids [] /Count 0 >>'   'endobj'   'xref'   '0 3'   '0000000000 65535 f '   '0000000009 00000 n '   '0000000058 00000 n '   'trailer'   '<< /Size 3 /Root 1 0 R >>'   'startxref'   '107'   '%%EOF' > "$PDF"

UPLOAD=$(curl -sS   --connect-timeout 2   --max-time "$T"   -b "$COOKIE"   -c "$COOKIE"   -F "file=@$PDF;type=application/pdf"   -F "dossierId=$DOSSIER_ID"   -F "type=piece"   -F "description=Pièce métier NEXT"   "$BASE/api/documents/upload")

DOCUMENT_ID=$(jq -r '.document.id // empty' <<<"$UPLOAD")

if [[ "$DOCUMENT_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "document upload" "$DOCUMENT_ID"
else
  fail "document upload" "$UPLOAD"
  exit 1
fi

# ------------------------------------------------------------
# 8. DOCUMENT READ-BACK / ANTIVIRUS
# ------------------------------------------------------------
echo
echo "--- 8. DOCUMENT READ-BACK ---"

DOCS=$(request_json   "$BASE/api/documents/upload?dossierId=$DOSSIER_ID")

DOC_FOUND=$(jq -r --arg id "$DOCUMENT_ID"   '[.documents[] | select(.id == $id)] | length'   <<<"$DOCS")

AV_STATUS=$(jq -r --arg id "$DOCUMENT_ID"   '.documents[] | select(.id == $id) | .antivirusStatus // empty'   <<<"$DOCS")

if [ "$DOC_FOUND" = "1" ]; then
  ok "document read-back" "antivirus=${AV_STATUS:-missing}"
else
  fail "document read-back" "$DOCS"
fi

# ------------------------------------------------------------
# 9. LEGAL DEADLINE
# ------------------------------------------------------------
echo
echo "--- 9. LEGAL DEADLINE ---"

REFERENCE_DATE=$(date -u +"%Y-%m-%dT00:00:00.000Z")

DEADLINE=$(curl -sS   --connect-timeout 2   --max-time "$T"   -H "Content-Type: application/json"   -X POST   -b "$COOKIE"   -c "$COOKIE"   -d "{
    \"dossierId\":\"$DOSSIER_ID\",
    \"clientId\":\"$CLIENT_ID\",
    \"type\":\"CUSTOM\",
    \"label\":\"Échéance E2E NEXT\",
    \"referenceDate\":\"$REFERENCE_DATE\",
    \"legalDays\":30,
    \"legalBasis\":\"E2E NEXT\"
  }"   "$BASE/api/legal-deadlines")

DEADLINE_ID=$(jq -r '.deadline.id // empty' <<<"$DEADLINE")

if [[ "$DEADLINE_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  ok "legal deadline" "$DEADLINE_ID"
else
  fail "legal deadline" "$DEADLINE"
fi

# ------------------------------------------------------------
# 10. TENANT ISOLATION
# ------------------------------------------------------------
echo
echo "--- 10. TENANT ISOLATION ---"

OTHER_ID="00000000-0000-0000-0000-000000000000"

OTHER=$(curl -sS   --connect-timeout 2   --max-time "$T"   -b "$COOKIE"   "$BASE/api/dossiers/$OTHER_ID" || true)

if jq -e '.error' >/dev/null 2>&1 <<<"$OTHER"; then
  ok "tenant isolation" "foreign dossier rejected"
else
  fail "tenant isolation" "$OTHER"
fi

# ------------------------------------------------------------
# 11. FINAL SESSION
# ------------------------------------------------------------
echo
echo "--- 11. FINAL SESSION ---"

FINAL_SESSION=$(request_json "$BASE/api/auth/session")
FINAL_ID=$(jq -r '.user.id // empty' <<<"$FINAL_SESSION")
FINAL_TENANT=$(jq -r '.user.tenantId // empty' <<<"$FINAL_SESSION")

if [ "$FINAL_ID" = "$USER_ID" ] &&
   [ "$FINAL_TENANT" = "$TENANT_ID" ]; then
  ok "final session" "user=$FINAL_ID tenant=$FINAL_TENANT"
else
  fail "final session" "$FINAL_SESSION"
fi

echo
echo "============================================================"
echo " PASS=$PASS FAIL=$FAIL"
echo "============================================================"

if [ "$FAIL" -eq 0 ]; then
  echo "✅ E2E BUSINESS NEXT GREEN"
  exit 0
else
  echo "❌ E2E BUSINESS NEXT FAILED"
  exit 1
fi
