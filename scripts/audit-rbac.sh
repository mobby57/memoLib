#!/usr/bin/env bash
# Audit RBAC : liste les routes API et cherche les contrôles de role.
# LECTURE SEULE.
set -uo pipefail
cd "$(dirname "$0")/.."

echo "═══ ROUTES API : contrôle de rôle ═══"
printf "%-70s %-8s %-8s %-8s\n" "ROUTE" "AUTH" "ROLE" "TENANT"
printf '%.0s─' {1..96}; echo

for f in $(find src/app/api -name 'route.ts' | sort); do
  # Ignore les webhooks (contrôle par signature, pas par session)
  case "$f" in
    *webhooks*|*cron*) continue ;;
  esac
  route="${f#src/app/api}"; route="${route%/route.ts}"

  AUTH="—"; ROLE="—"; TENANT="—"
  grep -qE 'await auth\(\)|requireAuth|clerkAuth' "$f" && AUTH="✅"
  grep -qE "user\.role|session\.user\.role|hasRole|requireRole|\.includes\(user" "$f" && ROLE="✅"
  grep -qE 'tenantId' "$f" && TENANT="✅"

  # Alerte si auth présente mais pas de rôle (route probablement non protégée)
  flag=""
  [[ "$AUTH" == "✅" && "$ROLE" == "—" ]] && flag="  ⚠️  role non vérifié"
  printf "%-70s %-8s %-8s %-8s%s\n" "$route" "$AUTH" "$ROLE" "$TENANT" "$flag"
done
