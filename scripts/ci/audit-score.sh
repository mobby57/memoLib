#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

MIN_SCORE="${AUDIT_MIN_SCORE:-85}"
REPORT_FILE="audit-ci-report.md"

score=100
p0_count=0
p1_count=0
p2_count=0

P0_PENALTY=25
P1_PENALTY=10
P2_PENALTY=5

report_lines=()

add_finding() {
  local severity="$1"
  local title="$2"
  local details="$3"

  case "$severity" in
    P0)
      p0_count=$((p0_count + 1))
      score=$((score - P0_PENALTY))
      ;;
    P1)
      p1_count=$((p1_count + 1))
      score=$((score - P1_PENALTY))
      ;;
    P2)
      p2_count=$((p2_count + 1))
      score=$((score - P2_PENALTY))
      ;;
  esac

  report_lines+=("- [${severity}] ${title}: ${details}")
}

file_exists() {
  local path="$1"
  [ -f "$path" ]
}

count_matches() {
  local pattern="$1"
  shift
  local includes=("$@")

  if [ "${#includes[@]}" -eq 0 ]; then
    grep -RInE "$pattern" . 2>/dev/null | wc -l | tr -d ' '
  else
    grep -RInE "$pattern" "${includes[@]}" 2>/dev/null | wc -l | tr -d ' '
  fi
}

# P0 — Auth wiring cassé
if ! file_exists "src/frontend/app/api/auth/[...nextauth]/route.ts"; then
  missing_refs=$(count_matches "@/app/api/auth/\[\.\.\.nextauth\]/route" "src/frontend/app/api" "src/frontend")
  if [ "${missing_refs:-0}" -gt 0 ]; then
    add_finding "P0" "Auth NextAuth introuvable" "${missing_refs} import(s) vers '@/app/api/auth/[...nextauth]/route' sans fichier cible"
  fi
fi

if ! file_exists "src/frontend/lib/auth.ts"; then
  missing_authlib_refs=$(count_matches "from ['\"]@/lib/auth['\"]|from ['\"]@/lib/auth['\"]" "src/frontend/app/api" "src/frontend")
  if [ "${missing_authlib_refs:-0}" -gt 0 ]; then
    add_finding "P0" "Module authOptions introuvable" "${missing_authlib_refs} import(s) vers '@/lib/auth' sans fichier cible"
  fi
fi

# P0 — Credentials hardcodés dans runtime backend
hardcoded_backend=$(count_matches "admin123|Admin123!|password\s*==\s*\"|password\s*==\s*'" "backend-python" "src/backend")
if [ "${hardcoded_backend:-0}" -gt 0 ]; then
  add_finding "P0" "Credentials hardcodés backend" "${hardcoded_backend} occurrence(s) détectée(s) dans backend-python/src/backend"
fi

# P1 — Endpoints localhost hardcodés dans API routes
localhost_api=$(count_matches "http://localhost:(3000|5000|8000)" "src/frontend/app/api")
if [ "${localhost_api:-0}" -gt 0 ]; then
  add_finding "P1" "URL localhost codées en dur" "${localhost_api} occurrence(s) dans src/frontend/app/api"
fi

# P1 — Validation Zod absente sur routes API v1 (contrôle basique)
v1_routes_count=$(find src/frontend/app/api/v1 -name "route.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "${v1_routes_count:-0}" -gt 0 ]; then
  zod_usage_count=$(count_matches "zod|z\.object\(|safeParse\(" "src/frontend/app/api/v1")
  if [ "${zod_usage_count:-0}" -eq 0 ]; then
    add_finding "P1" "Validation d'entrée insuffisante" "Aucune validation Zod détectée dans src/frontend/app/api/v1"
  fi
fi

# P2 — TypeScript strict désactivé
if file_exists "tsconfig.json"; then
  if grep -q '"strict"\s*:\s*false' tsconfig.json; then
    add_finding "P2" "TypeScript strict désactivé" "tsconfig.json contient \"strict\": false"
  fi
fi

# P2 — Tests Jest potentiellement instables (ESM setup)
if file_exists "jest.setup.js"; then
  if grep -q "^import " jest.setup.js; then
    add_finding "P2" "Setup Jest ESM" "jest.setup.js utilise import ESM (vérifier cohérence avec config Jest)"
  fi
fi

if [ "$score" -lt 0 ]; then
  score=0
fi

status="PASS"
if [ "$p0_count" -gt 0 ]; then
  status="FAIL"
fi
if [ "$score" -lt "$MIN_SCORE" ]; then
  status="FAIL"
fi

{
  echo "# Audit CI Report"
  echo
  echo "- Score: ${score}/100"
  echo "- Seuil minimum: ${MIN_SCORE}"
  echo "- P0: ${p0_count}"
  echo "- P1: ${p1_count}"
  echo "- P2: ${p2_count}"
  echo "- Status: ${status}"
  echo
  echo "## Findings"
  if [ "${#report_lines[@]}" -eq 0 ]; then
    echo "- Aucun finding"
  else
    printf '%s\n' "${report_lines[@]}"
  fi
} > "$REPORT_FILE"

cat "$REPORT_FILE"

if [ "$status" = "FAIL" ]; then
  echo ""
  echo "Audit CI bloquant: échec (P0>0 ou score < seuil)."
  exit 1
fi

echo ""
echo "Audit CI réussi."
