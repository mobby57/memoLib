#!/usr/bin/env bash
# Audit RBAC v2 : cherche aussi les helpers (requireAuth, requireAdmin, etc.)
set -uo pipefail
cd "$(dirname "$0")/.."

echo "═══ ROUTES : contrôles détectés (helpers inclus) ═══"
printf "%-65s %-6s %-6s %-6s %-6s\n" "ROUTE" "AUTH" "ROLE" "TENANT" "HELPER"
printf '%.0s─' {1..100}; echo

SUSPECTS=0
for f in $(find src/app/api -name 'route.ts' | sort); do
  case "$f" in
    *webhooks*|*cron*) continue ;;
  esac
  route="${f#src/app/api}"; route="${route%/route.ts}"

  AUTH="—"; ROLE="—"; TENANT="—"; HELPER="—"
  grep -qE 'await auth\(\)|requireAuth' "$f" && AUTH="✅"
  grep -qE "user\.role|session\.user\.role|hasRole|requireRole|includes\(user" "$f" && ROLE="✅"
  grep -qE 'tenantId' "$f" && TENANT="✅"
  # Détecte les imports de helpers de sécurité
  grep -qE "from '@/lib/(auth|security|permissions|guards)'" "$f" && HELPER="✅"
  # Détecte les guards middleware/route group
  grep -qE 'requireAdmin|requirePermission|ensureRole|assertRole' "$f" && HELPER="✅"

  # Route suspecte = auth + tenant mais pas de role ET pas de helper
  if [[ "$AUTH" == "✅" && "$ROLE" == "—" && "$HELPER" == "—" ]]; then
    printf "%-65s %-6s %-6s %-6s %-6s  ⚠️\n" "$route" "$AUTH" "$ROLE" "$TENANT" "$HELPER"
    SUSPECTS=$((SUSPECTS+1))
  elif [[ "$AUTH" == "✅" && ( "$ROLE" == "✅" || "$HELPER" == "✅" ) ]]; then
    printf "%-65s %-6s %-6s %-6s %-6s  ✅\n" "$route" "$AUTH" "$ROLE" "$TENANT" "$HELPER"
  fi
  # Routes sans AUTH ni HELPER (potentiellement publiques) — silencieuses
done

echo
echo "Suspects (auth mais pas de role ni helper) : $SUSPECTS"
