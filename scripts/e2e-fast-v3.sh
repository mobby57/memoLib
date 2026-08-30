#!/usr/bin/env bash
set -u

BASE="${BASE:-http://127.0.0.1:3000}"
T="${T:-3}"

echo "=== memoLib FAST V3 ==="
echo "BASE=$BASE"
echo "TIMEOUT=${T}s"
echo

check() {
  local name="$1"
  local path="$2"

  local code
  code=$(curl -sS \
    --connect-timeout 1 \
    --max-time "$T" \
    -o /dev/null \
    -w '%{http_code}' \
    "$BASE$path" 2>/dev/null) || code="000"

  printf '%-12s HTTP %s\n' "$name" "$code"
}

check health   /api/health
check session  /api/auth/session
check docs401  /api/documents/upload?dossierId=test

echo
echo "--- response times ---"

for path in / /fr /fr/auth/login /fr/auth/register /pricing; do
  result=$(curl -sS \
    --connect-timeout 1 \
    --max-time "$T" \
    -o /dev/null \
    -w '%{http_code} %{time_total}s' \
    "$BASE$path" 2>/dev/null) || result="000 timeout"

  printf '%-22s %s\n' "$path" "$result"
done

echo
echo "=== FIN ==="
