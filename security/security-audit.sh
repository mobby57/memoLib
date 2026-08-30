#!/usr/bin/env bash
set -uo pipefail

# ============================================================================
# memoLib — Security Audit / Security Gate
# ============================================================================
#
# Usage:
#   ./security/security-audit.sh
#   ./security/security-audit.sh --strict
#   ./security/security-audit.sh --json
#   ./security/security-audit.sh --no-tests
#
# Exit codes:
#   0 = audit passed
#   1 = findings above configured threshold
#   2 = usage/configuration error
#
# IMPORTANT:
# This is a static security audit. It does NOT prove that the application
# is secure or legally compliant. It is a security gate designed to catch
# dangerous patterns early.
# ============================================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STRICT=0
JSON=0
RUN_TESTS=1

CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
INFO=0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

SRC_DIRS=(
  "src/app/api"
  "src/lib"
)

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT=1
      shift
      ;;
    --json)
      JSON=1
      shift
      ;;
    --no-tests)
      RUN_TESTS=0
      shift
      ;;
    -h|--help)
      cat <<HELP
memoLib Security Audit

Usage:
  ./security/security-audit.sh
  ./security/security-audit.sh --strict
  ./security/security-audit.sh --json
  ./security/security-audit.sh --no-tests

Options:
  --strict      Treat MEDIUM findings as build-blocking.
  --json        Output machine-readable summary.
  --no-tests    Skip security test discovery/execution.
  -h, --help    Show this help.

Exit:
  0  Audit passed
  1  Security gate failed
  2  Invalid usage
HELP
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

files() {
  find "${SRC_DIRS[@]}" \
    -type f \
    \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -print 2>/dev/null
}

add_finding() {
  local severity="$1"
  local rule="$2"
  local file="$3"
  local line="$4"
  local message="$5"

  case "$severity" in
    CRITICAL) ((CRITICAL++)) || true ;;
    HIGH)     ((HIGH++)) || true ;;
    MEDIUM)   ((MEDIUM++)) || true ;;
    LOW)      ((LOW++)) || true ;;
    INFO)     ((INFO++)) || true ;;
  esac

  if [[ "$JSON" -eq 0 ]]; then
    printf "\n[%s] %s\n" "$severity" "$rule"
    printf "  File : %s:%s\n" "$file" "$line"
    printf "  %s\n" "$message"
  fi
}

header() {
  [[ "$JSON" -eq 1 ]] && return

  echo
  echo "================================================================"
  echo " memoLib — SECURITY AUDIT"
  echo "================================================================"
  echo " Project : $ROOT"
  echo " Date    : $(timestamp)"
  echo " Strict  : $STRICT"
  echo "================================================================"
}

section() {
  [[ "$JSON" -eq 1 ]] && return
  echo
  echo "----------------------------------------------------------------"
  echo " $1"
  echo "----------------------------------------------------------------"
}

# ---------------------------------------------------------------------------
# Preconditions
# ---------------------------------------------------------------------------

if [[ ! -d "$ROOT/src" ]]; then
  echo "ERROR: src/ directory not found." >&2
  exit 2
fi

header

# ---------------------------------------------------------------------------
# 1. Secrets / credentials
# ---------------------------------------------------------------------------

section "1. SECRET / CREDENTIAL SCAN"

SECRET_PATTERNS_FILE="$TMP_DIR/secrets.txt"

cat > "$SECRET_PATTERNS_FILE" <<'PATTERNS'
(AKIA[0-9A-Z]{16})
(sk-[A-Za-z0-9_-]{20,})
(xox[baprs]-[A-Za-z0-9-]{20,})
-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----
(password|passwd|pwd)[[:space:]]*[:=][[:space:]]*["'][^"']{6,}["']
(secret|api[_-]?key|access[_-]?token)[[:space:]]*[:=][[:space:]]*["'][^"']{8,}["']
PATTERNS

while IFS= read -r pattern; do
  grep -R -n -E "$pattern" \
    src \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.json" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    2>/dev/null |
  while IFS=: read -r file line rest; do
    add_finding \
      "CRITICAL" \
      "SECRET_EXPOSURE" \
      "$file" \
      "$line" \
      "Possible credential/secret detected in source code."
  done
done < "$SECRET_PATTERNS_FILE"

# ---------------------------------------------------------------------------
# 2. API authentication
# ---------------------------------------------------------------------------

section "2. API AUTHENTICATION"

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  # Ignore obvious non-route files.
  [[ "$file" != *"/route.ts" && "$file" != *"/route.tsx" ]] && continue

  # Publicly intentional routes can be documented here.
  case "$file" in
    *"/api/auth/"*)
      continue
      ;;
    *"/api/health/"*)
      continue
      ;;
    *"/api/webhooks/"*)
      # Webhooks normally use signatures rather than sessions.
      continue
      ;;
  esac

  if ! grep -Eq \
    "getServerSession|authOptions|requireAuth|require[A-Za-z]*Auth|withAuth|NextAuth|session\.user|Authorization|Bearer|verify.*signature|verify.*token" \
    "$file" 2>/dev/null; then

    add_finding \
      "HIGH" \
      "API_AUTH_MISSING" \
      "$file" \
      "1" \
      "API route contains no obvious authentication/authorization mechanism."
  fi
done < <(files)

# ---------------------------------------------------------------------------
# 3. Dossier access without tenant constraint
# ---------------------------------------------------------------------------

section "3. DOSSIER TENANT ISOLATION"

# Detect common dangerous patterns:
#
#   where: { id: dossierId }
#   where: { id }
#
# We deliberately do NOT automatically fail every occurrence because some
# internal/system functions may already have authorization at a higher layer.

while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  # Ignore test fixtures.
  [[ "$file" == *"__tests__"* || "$file" == *".test."* || "$file" == *".spec."* ]] && continue

  # Only relevant Prisma dossier operations.
  if grep -Eq \
    "prisma\.dossier\.(findUnique|findFirst|findMany|update|delete|count|groupBy)" \
    "$file" 2>/dev/null; then

    # Examine a window around the first occurrence.
    start=$((line))
    end=$((line + 15))
    block="$(sed -n "${start},${end}p" "$file" 2>/dev/null)"

    if grep -Eq \
      "where:[[:space:]]*\{[[:space:]]*(id|id:[[:space:]]*(dossierId|id))" \
      <<< "$block" &&
      ! grep -Eq "tenantId" <<< "$block"; then

      add_finding \
        "HIGH" \
        "DOSSIER_TENANT_GUARD_MISSING" \
        "$file" \
        "$line" \
        "Dossier query appears to use an ID without an adjacent tenantId constraint. Review authorization path."
    fi
  fi
done < <(
  grep -R -n -E \
    "prisma\.dossier\.(findUnique|findFirst|findMany|update|delete|count|groupBy)" \
    "${SRC_DIRS[@]}" \
    --include="*.ts" \
    --include="*.tsx" \
    2>/dev/null || true
)

# ---------------------------------------------------------------------------
# 4. Direct dossier findUnique by ID
# ---------------------------------------------------------------------------

section "4. PRISMA findUnique DOSSIER REVIEW"

grep -R -n -B 2 -A 8 \
  -E "prisma\.dossier\.findUnique" \
  "${SRC_DIRS[@]}" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue
  [[ "$file" == *"__tests__"* || "$file" == *".test."* ]] && continue

  # Only report if the local snippet does not contain tenantId.
  snippet="$(grep -A 10 -B 2 \
    -E "prisma\.dossier\.findUnique" \
    "$file" 2>/dev/null | head -30)"

  if ! grep -q "tenantId" <<< "$snippet"; then
    add_finding \
      "MEDIUM" \
      "FINDUNIQUE_DOSSIER_REVIEW" \
      "$file" \
      "$line" \
      "findUnique() appears not to constrain dossier access by tenant. Manual review required."
  fi
done

# ---------------------------------------------------------------------------
# 5. Client-controlled tenantId
# ---------------------------------------------------------------------------

section "5. CLIENT-CONTROLLED TENANT ID"

grep -R -n -E \
  "(req\.json\(\)|request\.json\(\)|searchParams|get\(['\"]tenantId|body\.tenantId|data\.tenantId)" \
  "${SRC_DIRS[@]}" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  # Skip harmless reads where tenantId is immediately compared to session.
  block="$(sed -n "$((line > 3 ? line - 3 : 1)),$((line + 8))p" "$file" 2>/dev/null)"

  if grep -Eq "tenantId" <<< "$block" &&
     ! grep -Eq "session.*tenantId|user.*tenantId|sessionTenantId" <<< "$block"; then

    add_finding \
      "HIGH" \
      "CLIENT_CONTROLLED_TENANT_ID" \
      "$file" \
      "$line" \
      "tenantId appears to originate from request data without an obvious session-derived comparison."
  fi
done

# ---------------------------------------------------------------------------
# 6. Dangerous update/delete by raw ID
# ---------------------------------------------------------------------------

section "6. UPDATE / DELETE AUTHORIZATION"

grep -R -n -E \
  "prisma\.dossier\.(update|delete)\(" \
  "${SRC_DIRS[@]}" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  block="$(sed -n "$line,$((line + 18))p" "$file" 2>/dev/null)"

  if grep -Eq "where:[[:space:]]*\{[[:space:]]*id:[[:space:]]*(dossierId|id)" <<< "$block" &&
     ! grep -Eq "tenantId" <<< "$block"; then

    add_finding \
      "HIGH" \
      "DOSSIER_MUTATION_WITHOUT_TENANT" \
      "$file" \
      "$line" \
      "Dossier update/delete appears to operate by raw ID without an adjacent tenant constraint."
  fi
done

# ---------------------------------------------------------------------------
# 7. Unsafe console logging / PII
# ---------------------------------------------------------------------------

section "7. PII / SENSITIVE LOGGING"

grep -R -n -E \
  "console\.(log|info|warn|error).*\
(email|phone|telephone|address|adresse|nom|prenom|firstName|lastName|\
client|document|content|message|notes|description|dossier)" \
  "${SRC_DIRS[@]}" \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  add_finding \
    "MEDIUM" \
    "POTENTIAL_PII_LOGGING" \
    "$file" \
    "$line" \
    "Console logging may expose personal/confidential data. Review and replace with sanitized structured logging."
done

# ---------------------------------------------------------------------------
# 8. AI / external providers in confidential security code
# ---------------------------------------------------------------------------

section "8. CONFIDENTIAL AI BOUNDARY"

CONF_FILE="src/lib/security/confidential-mode.ts"

if [[ -f "$CONF_FILE" ]]; then
  if grep -Eqi \
    "openai|anthropic|mistral|cloudflare|google.*ai|gemini" \
    "$CONF_FILE"; then

    add_finding \
      "CRITICAL" \
      "CONFIDENTIAL_MODE_CLOUD_PROVIDER" \
      "$CONF_FILE" \
      "1" \
      "Confidential-mode security boundary contains a cloud AI provider reference."
  fi
fi

# Search cloud AI usage in API/lib code.
grep -R -n -Ei \
  "openai|anthropic|@mistralai|mistral.*client|google.*generativeai|gemini" \
  src/app/api src/lib \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  if grep -q "confidential" "$file" 2>/dev/null; then
    add_finding \
      "HIGH" \
      "AI_CONFIDENTIAL_BOUNDARY_REVIEW" \
      "$file" \
      "$line" \
      "Cloud AI reference appears in a file related to confidential processing. Review data-flow enforcement."
  fi
done

# ---------------------------------------------------------------------------
# 9. Dangerous hardcoded localhost/cloud fallback
# ---------------------------------------------------------------------------

section "9. AI FALLBACK REVIEW"

grep -R -n -Ei \
  "fallback.*openai|fallback.*anthropic|fallback.*mistral|catch.*openai|catch.*anthropic|catch.*mistral" \
  src \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  add_finding \
    "HIGH" \
    "CLOUD_AI_FALLBACK" \
    "$file" \
    "$line" \
    "Potential cloud AI fallback detected. Confidential dossiers must fail closed."
done

# ---------------------------------------------------------------------------
# 10. Dangerous eval / dynamic execution
# ---------------------------------------------------------------------------

section "10. DYNAMIC CODE EXECUTION"

grep -R -n -E \
  "\beval\(|new[[:space:]]+Function\(|child_process\.(exec|execSync)\(" \
  src \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  add_finding \
    "HIGH" \
    "DYNAMIC_CODE_EXECUTION" \
    "$file" \
    "$line" \
    "Dynamic code/shell execution detected. Verify input cannot be attacker-controlled."
done

# ---------------------------------------------------------------------------
# 11. SQL raw queries
# ---------------------------------------------------------------------------

section "11. RAW SQL REVIEW"

grep -R -n -E \
  "prisma\.\$queryRaw|prisma\.\$executeRaw|prisma\.\$queryRawUnsafe|prisma\.\$executeRawUnsafe" \
  src \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  severity="MEDIUM"

  if grep -Eq \
    "queryRawUnsafe|executeRawUnsafe" \
    "$file"; then
    severity="HIGH"
  fi

  add_finding \
    "$severity" \
    "RAW_SQL_REVIEW" \
    "$file" \
    "$line" \
    "Raw SQL detected. Verify parameterization and tenant filtering."
done

# ---------------------------------------------------------------------------
# 12. Dangerous file upload patterns
# ---------------------------------------------------------------------------

section "12. FILE UPLOAD REVIEW"

grep -R -n -E \
  "formData\(|\.arrayBuffer\(\)|writeFile|writeFileSync|createWriteStream|putObject|upload" \
  src/app/api \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  block="$(sed -n "$((line > 5 ? line - 5 : 1)),$((line + 12))p" "$file" 2>/dev/null)"

  if ! grep -Eq \
    "session|auth|tenantId|mime|contentType|size|MAX_|maxSize|file.*type" \
    <<< "$block"; then

    add_finding \
      "HIGH" \
      "FILE_UPLOAD_REVIEW" \
      "$file" \
      "$line" \
      "File handling detected without an obvious nearby auth/type/size validation."
  fi
done

# ---------------------------------------------------------------------------
# 13. CORS / wildcard origin
# ---------------------------------------------------------------------------

section "13. CORS REVIEW"

grep -R -n -E \
  "Access-Control-Allow-Origin.*\*|origin:[[:space:]]*['\"]\*['\"]|cors.*\*" \
  src \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  add_finding \
    "MEDIUM" \
    "WILDCARD_CORS" \
    "$file" \
    "$line" \
    "Wildcard CORS detected. Verify that this endpoint is intentionally public."
done

# ---------------------------------------------------------------------------
# 14. Dangerous auth bypass / development bypass
# ---------------------------------------------------------------------------

section "14. AUTH BYPASS REVIEW"

grep -R -n -Ei \
  "skipAuth|bypassAuth|disableAuth|authDisabled|ALLOW_UNAUTHENTICATED|DEV_AUTH|mock.*session|fake.*session" \
  src \
  --include="*.ts" \
  --include="*.tsx" \
  2>/dev/null |
while IFS=: read -r file line rest; do
  [[ -z "$file" ]] && continue

  add_finding \
    "CRITICAL" \
    "AUTH_BYPASS_PATTERN" \
    "$file" \
    "$line" \
    "Potential authentication bypass/development authentication detected."
done

# ---------------------------------------------------------------------------
# 15. Tests: tenant isolation
# ---------------------------------------------------------------------------

section "15. TENANT ISOLATION TESTS"

TEST_DIR="src/__tests__"

TENANT_TEST_COUNT=0

if [[ -d "$TEST_DIR" ]]; then
  TENANT_TEST_COUNT="$(
    grep -R -l -Ei \
      "tenant.?isolation|cross.?tenant|different.?tenant|tenantId.*tenantId|\
tenant.?A|tenant.?B|forbidden.*tenant|unauthorized.*tenant" \
      "$TEST_DIR" \
      --include="*.test.ts" \
      --include="*.spec.ts" \
      2>/dev/null |
    wc -l
  )"
fi

if [[ "${TENANT_TEST_COUNT:-0}" -eq 0 ]]; then
  add_finding \
    "HIGH" \
    "TENANT_ISOLATION_TESTS_MISSING" \
    "$TEST_DIR" \
    "1" \
    "No obvious cross-tenant isolation test was detected."
else
  if [[ "$JSON" -eq 0 ]]; then
    echo "  Found $TENANT_TEST_COUNT tenant-isolation test file(s)."
  fi
fi

# ---------------------------------------------------------------------------
# 16. Confidential mode tests
# ---------------------------------------------------------------------------

section "16. CONFIDENTIAL MODE TESTS"

CONF_TEST_COUNT=0

if [[ -d "$TEST_DIR" ]]; then
  CONF_TEST_COUNT="$(
    grep -R -l -Ei \
      "confidentialMode|confidential.?mode|cloud.*blocked|ollama.*regex|\
openai.*blocked|anthropic.*blocked" \
      "$TEST_DIR" \
      --include="*.test.ts" \
      --include="*.spec.ts" \
      2>/dev/null |
    wc -l
  )"
fi

if [[ "${CONF_TEST_COUNT:-0}" -eq 0 ]]; then
  add_finding \
    "MEDIUM" \
    "CONFIDENTIAL_MODE_TESTS_MISSING" \
    "$TEST_DIR" \
    "1" \
    "No obvious confidential-mode security test was detected."
else
  if [[ "$JSON" -eq 0 ]]; then
    echo "  Found $CONF_TEST_COUNT confidential-mode test file(s)."
  fi
fi

# ---------------------------------------------------------------------------
# 17. GDPR/security deletion tests
# ---------------------------------------------------------------------------

section "17. DATA DELETION / RETENTION TESTS"

GDPR_TEST_COUNT=0

if [[ -d "$TEST_DIR" ]]; then
  GDPR_TEST_COUNT="$(
    grep -R -l -Ei \
      "right.?to.?erasure|retention|RGPD|GDPR|legalRetention|checkLegalRetention" \
      "$TEST_DIR" \
      --include="*.test.ts" \
      --include="*.spec.ts" \
      2>/dev/null |
    wc -l
  )"
fi

if [[ "${GDPR_TEST_COUNT:-0}" -eq 0 ]]; then
  add_finding \
    "MEDIUM" \
    "GDPR_TESTS_MISSING" \
    "$TEST_DIR" \
    "1" \
    "No obvious GDPR retention/deletion test was detected."
else
  if [[ "$JSON" -eq 0 ]]; then
    echo "  Found $GDPR_TEST_COUNT GDPR/retention test file(s)."
  fi
fi

# ---------------------------------------------------------------------------
# 18. TypeScript / lint sanity checks
# ---------------------------------------------------------------------------

section "18. STATIC ANALYSIS"

if [[ -f package.json ]]; then

  if command -v npm >/dev/null 2>&1; then

    if npm run --silent typecheck >/dev/null 2>&1; then
      [[ "$JSON" -eq 0 ]] && echo "  TypeScript : PASS"
    else
      add_finding \
        "HIGH" \
        "TYPECHECK_FAILED" \
        "package.json" \
        "1" \
        "npm run typecheck failed or the script is unavailable."
    fi

    if npm run --silent lint >/dev/null 2>&1; then
      [[ "$JSON" -eq 0 ]] && echo "  Lint       : PASS"
    else
      add_finding \
        "MEDIUM" \
        "LINT_FAILED" \
        "package.json" \
        "1" \
        "npm run lint failed or the script is unavailable."
    fi

  else
    add_finding \
      "LOW" \
      "NPM_NOT_FOUND" \
      "environment" \
      "1" \
      "npm was not found; static project checks were skipped."
  fi

else
  add_finding \
    "HIGH" \
    "PACKAGE_JSON_MISSING" \
    "$ROOT" \
    "1" \
    "package.json was not found."
fi

# ---------------------------------------------------------------------------
# 19. Optional security test execution
# ---------------------------------------------------------------------------

section "19. SECURITY TEST EXECUTION"

if [[ "$RUN_TESTS" -eq 1 ]]; then

  if [[ -f package.json ]] && command -v npm >/dev/null 2>&1; then

    if npm run --silent test:security >/dev/null 2>&1; then
      [[ "$JSON" -eq 0 ]] && echo "  test:security : PASS"
    else
      # Don't assume the script exists; detect it.
      if node -e '
        const p=require("./package.json");
        process.exit(p.scripts && p.scripts["test:security"] ? 0 : 1)
      ' >/dev/null 2>&1; then

        add_finding \
          "HIGH" \
          "SECURITY_TESTS_FAILED" \
          "package.json" \
          "1" \
          "npm run test:security failed."
      else
        [[ "$JSON" -eq 0 ]] && \
          echo "  test:security : NOT CONFIGURED"
      fi
    fi

  fi
fi

# ---------------------------------------------------------------------------
# 20. Git hygiene
# ---------------------------------------------------------------------------

section "20. GIT SECRET HYGIENE"

if command -v git >/dev/null 2>&1 && [[ -d ".git" ]]; then

  if git ls-files | grep -E \
    '(^|/)(\.env|\.env\.local|\.env\.production|.*\.pem|.*\.key)$' \
    >/dev/null 2>&1; then

    add_finding \
      "CRITICAL" \
      "SECRET_FILE_TRACKED_BY_GIT" \
      ".git" \
      "1" \
      "Potential environment/private-key file is tracked by Git."
  fi

else
  [[ "$JSON" -eq 0 ]] && echo "  Git repository : not detected"
fi

# ---------------------------------------------------------------------------
# 21. Summary
# ---------------------------------------------------------------------------

TOTAL=$((CRITICAL + HIGH + MEDIUM + LOW))

BLOCKED=0

if (( CRITICAL > 0 || HIGH > 0 )); then
  BLOCKED=1
fi

if (( STRICT == 1 && MEDIUM > 0 )); then
  BLOCKED=1
fi

if [[ "$JSON" -eq 1 ]]; then
  printf '{\n'
  printf '  "timestamp": "%s",\n' "$(timestamp)"
  printf '  "project": "%s",\n' "$ROOT"
  printf '  "strict": %s,\n' "$([[ "$STRICT" -eq 1 ]] && echo true || echo false)"
  printf '  "critical": %d,\n' "$CRITICAL"
  printf '  "high": %d,\n' "$HIGH"
  printf '  "medium": %d,\n' "$MEDIUM"
  printf '  "low": %d,\n' "$LOW"
  printf '  "info": %d,\n' "$INFO"
  printf '  "total": %d,\n' "$TOTAL"
  printf '  "blocked": %s\n' "$([[ "$BLOCKED" -eq 1 ]] && echo true || echo false)"
  printf '}\n'
else

  echo
  echo "================================================================"
  echo " SECURITY AUDIT SUMMARY"
  echo "================================================================"
  printf " CRITICAL : %d\n" "$CRITICAL"
  printf " HIGH     : %d\n" "$HIGH"
  printf " MEDIUM   : %d\n" "$MEDIUM"
  printf " LOW      : %d\n" "$LOW"
  printf " INFO     : %d\n" "$INFO"
  printf " TOTAL    : %d\n" "$TOTAL"
  echo "================================================================"

  if (( BLOCKED == 1 )); then
    echo
    echo "❌ SECURITY GATE: FAILED"
    echo
    echo "Deployment should be BLOCKED."
    echo
    echo "Priority:"
    echo "  1. CRITICAL findings"
    echo "  2. HIGH findings"
    echo "  3. MEDIUM findings (especially with --strict)"
    echo
    exit 1
  else
    echo
    echo "✅ SECURITY GATE: PASSED"
    echo
    echo "No CRITICAL/HIGH findings detected by this static audit."
    echo
    exit 0
  fi
fi
