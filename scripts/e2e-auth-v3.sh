#!/usr/bin/env bash

BASE="${BASE:-http://127.0.0.1:3000}"
T="${T:-5}"
COOKIE="/tmp/memolib-e2e.cookies"
EMAIL="e2e-$(date +%s)@example.com"
PASSWORD="TestPassword123!"

rm -f "$COOKIE"

echo "=== memoLib AUTH V3 ==="
echo "BASE=$BASE"
echo "EMAIL=$EMAIL"
echo

request() {
  local name="$1"
  shift

  printf "%-16s " "$name"

  local output
  output=$(curl -sS \
    --connect-timeout 1 \
    --max-time "$T" \
    -b "$COOKIE" \
    -c "$COOKIE" \
    "$@" 2>&1)

  local rc=$?

  if [ "$rc" -ne 0 ]; then
    echo "FAIL curl=$rc"
    return 1
  fi

  echo "$output"
}

echo "--- 1. REGISTER ---"

REGISTER=$(curl -sS \
  --connect-timeout 1 \
  --max-time "$T" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{\"prenom\":\"E2E\",\"nom\":\"Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/register" 2>&1)

RC=$?

if [ "$RC" -ne 0 ]; then
  echo "register        FAIL curl=$RC"
else
  echo "register        $REGISTER"
fi

echo
echo "--- 2. SESSION BEFORE LOGIN ---"

SESSION=$(curl -sS \
  --connect-timeout 1 \
  --max-time "$T" \
  -b "$COOKIE" \
  "$BASE/api/auth/session" 2>&1)

RC=$?

if [ "$RC" -ne 0 ]; then
  echo "session-before   FAIL curl=$RC"
else
  echo "session-before   $SESSION"
fi

echo
echo "--- 3. NEXTAUTH CSRF ---"

CSRF_JSON=$(curl -sS \
  --connect-timeout 1 \
  --max-time "$T" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/csrf" 2>&1)

RC=$?

if [ "$RC" -ne 0 ]; then
  echo "csrf             FAIL curl=$RC"
  exit 1
fi

echo "csrf             $CSRF_JSON"

CSRF=$(printf '%s' "$CSRF_JSON" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')

if [ -z "$CSRF" ]; then
  echo "csrf             FAIL token missing"
  exit 1
fi

echo
echo "--- 4. LOGIN ---"

LOGIN=$(curl -sS \
  --connect-timeout 1 \
  --max-time "$T" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -X POST \
  -d "csrfToken=$CSRF&email=$EMAIL&password=$PASSWORD&json=true" \
  -b "$COOKIE" \
  -c "$COOKIE" \
  "$BASE/api/auth/callback/credentials" \
  -D /tmp/memolib-login.headers \
  2>&1)

RC=$?

if [ "$RC" -ne 0 ]; then
  echo "login            FAIL curl=$RC"
else
  echo "login            OK"
  echo "$LOGIN" | head -c 300
  echo
fi

echo
echo "--- 5. SESSION AFTER LOGIN ---"

SESSION2=$(curl -sS \
  --connect-timeout 1 \
  --max-time "$T" \
  -b "$COOKIE" \
  "$BASE/api/auth/session" 2>&1)

RC=$?

if [ "$RC" -ne 0 ]; then
  echo "session-after    FAIL curl=$RC"
else
  echo "session-after    $SESSION2"
fi

echo
echo "--- 6. DOCUMENTS ---"

DOC=$(curl -sS \
  --connect-timeout 1 \
  --max-time "$T" \
  -b "$COOKIE" \
  "$BASE/api/documents/upload?dossierId=test" 2>&1)

RC=$?

if [ "$RC" -ne 0 ]; then
  echo "documents        FAIL curl=$RC"
else
  echo "documents        $DOC"
fi

echo
echo "--- 7. SESSION REPEAT x3 ---"

for i in 1 2 3; do
  CODE=$(curl -sS \
    --connect-timeout 1 \
    --max-time "$T" \
    -o /tmp/session-$i.json \
    -w '%{http_code}' \
    -b "$COOKIE" \
    "$BASE/api/auth/session" 2>/dev/null)

  echo "session-$i        HTTP $CODE"
done

echo
echo "--- COOKIE ---"

if [ -s "$COOKIE" ]; then
  echo "cookie            OK"
else
  echo "cookie            EMPTY"
fi

echo
echo "=== FIN AUTH V3 ==="
