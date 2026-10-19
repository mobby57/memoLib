#!/usr/bin/env bash
# Audit RBAC v3 : cherche le rôle dans les variables locales aussi.
set -uo pipefail
cd "$(dirname "$0")/.."

SUSPECTS=()
PUBLICS=()

for f in $(find src/app/api -name 'route.ts' | sort); do
  case "$f" in *webhooks*|*cron*) continue ;; esac
  route="${f#src/app/api}"; route="${route%/route.ts}"

  HAS_AUTH=$(grep -cE 'await auth\(\)|requireAuth' "$f" || true)
  # Cherche le rôle PEU IMPORTE la variable : userRole, currentRole, role, (user).role, etc.
  HAS_ROLE=$(grep -cE "\.role|userRole|currentRole|hasRole|requireRole|\[.*'ADMIN'.*\]|\[.*'AVOCAT'.*\]|includes\(" "$f" || true)
  HAS_403=$(grep -cE "403|Forbidden|Interdit|Acces reserve|Accès réservé" "$f" || true)
  HAS_HELPER=$(grep -cE 'requireAdmin|requirePermission|ensureRole|assertRole|from .@/lib/(auth|security|permissions|guards)' "$f" || true)

  if [[ "$HAS_AUTH" -eq 0 && "$HAS_HELPER" -eq 0 ]]; then
    PUBLICS+=("$route")
  elif [[ "$HAS_AUTH" -gt 0 && "$HAS_ROLE" -eq 0 && "$HAS_403" -eq 0 && "$HAS_HELPER" -eq 0 ]]; then
    SUSPECTS+=("$route")
  fi
done

echo "═══ VRAIS SUSPECTS (auth mais ni role ni 403 ni helper) ═══"
if [[ ${#SUSPECTS[@]} -eq 0 ]]; then
  echo "  ✅ Aucun"
else
  printf '  ⚠️  %s\n' "${SUSPECTS[@]}"
fi

echo
echo "═══ ROUTES PUBLIQUES (ni auth ni helper) — à vérifier manuellement ═══"
printf '  ?  %s\n' "${PUBLICS[@]}"

echo
echo "Total : ${#SUSPECTS[@]} suspects, ${#PUBLICS[@]} publiques"
