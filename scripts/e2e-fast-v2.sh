#!/usr/bin/env bash

BASE="http://localhost:3000"
T=5

echo "=== memoLib FAST V2 ==="
echo

check() {
  NAME="$1"
  URL="$2"

  CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
    --max-time "$T" "$BASE$URL" 2>/dev/null || echo "000")

  printf "%-12s HTTP %s\n" "$NAME" "$CODE"
}

check "health"   "/api/health"
check "home"     "/fr"
check "login"    "/fr/auth/login"
check "register" "/fr/auth/register"
check "pricing"  "/pricing"

echo
echo "--- session ---"

CODE=$(curl -sS -o /tmp/session.txt -w "%{http_code}" \
  --max-time "$T" "$BASE/api/auth/session" 2>/dev/null || echo "000")

echo "session      HTTP $CODE"

if [ "$CODE" = "429" ]; then
  echo
  echo "!!! RATE LIMIT SUR /api/auth/session !!!"
  cat /tmp/session.txt
fi

echo
echo "--- documents ---"

CODE=$(curl -sS -o /tmp/documents.txt -w "%{http_code}" \
  --max-time "$T" \
  "$BASE/api/documents/upload?dossierId=test" \
  2>/dev/null || echo "000")

echo "documents    HTTP $CODE"

echo
echo "--- imports ---"

rg -n \
  "withLoginRateLimit|authOptions|rate-limit" \
  src/app/api/auth src/lib/auth src/lib/middleware \
  2>/dev/null | head -40

echo
echo "=== FIN ==="
