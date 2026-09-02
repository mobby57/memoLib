#!/usr/bin/env bash

set +e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="$ROOT/reports/mrf/latest"
EVIDENCE_DIR="$REPORT_DIR/evidence"

mkdir -p "$EVIDENCE_DIR"

REPORT="$REPORT_DIR/report.md"
VERDICT="$REPORT_DIR/verdict.json"

PASS=0
WARN=0
FAIL=0
P0=0
P1=0

declare -a RESULTS

log() {
  echo "$1" | tee -a "$REPORT"
}

pass() {
  PASS=$((PASS + 1))
  RESULTS+=("PASS|$1|$2|$3")
  log "✅ PASS — $1"
}

warn() {
  WARN=$((WARN + 1))
  RESULTS+=("WARN|$1|$2|$3")
  log "⚠️ WARN — $1"
}

fail() {
  FAIL=$((FAIL + 1))
  RESULTS+=("FAIL|$1|$2|$3")

  if [ "$2" = "P0" ]; then
    P0=$((P0 + 1))
  fi

  if [ "$2" = "P1" ]; then
    P1=$((P1 + 1))
  fi

  log "❌ FAIL [$2] — $1"
}

run_test() {
  ID="$1"
  GATE="$2"
  SEVERITY="$3"
  NAME="$4"
  shift 4

  EVIDENCE="$EVIDENCE_DIR/$ID.txt"

  {
    echo "MRF TEST"
    echo "ID: $ID"
    echo "GATE: $GATE"
    echo "SEVERITY: $SEVERITY"
    echo "TEST: $NAME"
    echo "DATE: $(date)"
    echo
    "$@"
  } > "$EVIDENCE" 2>&1

  CODE=$?

  if [ "$CODE" -eq 0 ]; then
    pass "$ID — $NAME" "$SEVERITY" "$GATE"
  else
    fail "$ID — $NAME" "$SEVERITY" "$GATE"
  fi
}

cat > "$REPORT" <<EOF
# MemoLib Readiness Framework — MRF 1.0

Date: $(date)
Project: $ROOT

## Verdict

EOF

log "============================================================"
log " MEMOLIB READINESS FRAMEWORK — MRF 1.0"
log "============================================================"
log ""

# ============================================================
# GATE 0 — PRODUCT
# ============================================================

log "## GATE 0 — PRODUCT DEFINITION"

if [ -f package.json ]; then
  pass "MRF-PROD-001 — package.json présent" "P2" "Product"
else
  fail "MRF-PROD-001 — package.json absent" "P1" "Product"
fi

if [ -f README.md ]; then
  pass "MRF-PROD-002 — README présent" "P2" "Product"
else
  warn "MRF-PROD-002 — README absent" "P3" "Product"
fi

if [ -d src ]; then
  pass "MRF-PROD-003 — structure applicative présente" "P2" "Product"
else
  fail "MRF-PROD-003 — structure src absente" "P1" "Product"
fi

# ============================================================
# GATE 1 — CRITICAL USER JOURNEY
# ============================================================

log ""
log "## GATE 1 — CRITICAL USER JOURNEY"

if grep -RIlE \
  "auth|login|session|oauth" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-JOURNEY-001 — authentification détectée" "P1" "Journey"
else
  fail "MRF-JOURNEY-001 — authentification introuvable" "P1" "Journey"
fi

if grep -RIlE \
  "gmail|outlook|mailbox|email" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-JOURNEY-002 — intégration email détectée" "P1" "Journey"
else
  warn "MRF-JOURNEY-002 — intégration email non détectée" "P1" "Journey"
fi

if grep -RIlE \
  "dossier|case|client" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-JOURNEY-003 — workflow dossier/client détecté" "P1" "Journey"
else
  warn "MRF-JOURNEY-003 — workflow dossier/client non détecté" "P1" "Journey"
fi

# ============================================================
# GATE 2 — RELIABILITY
# ============================================================

log ""
log "## GATE 2 — RELIABILITY"

if [ -f tsconfig.json ]; then
  npx tsc --noEmit --pretty false \
    > "$EVIDENCE_DIR/MRF-REL-001.txt" 2>&1

  if [ $? -eq 0 ]; then
    pass "MRF-REL-001 — TypeScript" "P1" "Reliability"
  else
    fail "MRF-REL-001 — TypeScript" "P1" "Reliability"
    tail -20 "$EVIDENCE_DIR/MRF-REL-001.txt" | tee -a "$REPORT"
  fi
else
  fail "MRF-REL-001 — tsconfig.json absent" "P1" "Reliability"
fi

if [ -f package.json ] && npm run 2>/dev/null | grep -qE '(^|[[:space:]])test'; then
  npm test -- --runInBand \
    > "$EVIDENCE_DIR/MRF-REL-002.txt" 2>&1

  if [ $? -eq 0 ]; then
    pass "MRF-REL-002 — Jest" "P1" "Reliability"
  else
    fail "MRF-REL-002 — Jest" "P1" "Reliability"
    tail -30 "$EVIDENCE_DIR/MRF-REL-002.txt" | tee -a "$REPORT"
  fi
else
  warn "MRF-REL-002 — script test absent" "P1" "Reliability"
fi

if npm run build > "$EVIDENCE_DIR/MRF-REL-003.txt" 2>&1; then
  pass "MRF-REL-003 — production build" "P1" "Reliability"
else
  fail "MRF-REL-003 — production build" "P1" "Reliability"
  tail -30 "$EVIDENCE_DIR/MRF-REL-003.txt" | tee -a "$REPORT"
fi

# ============================================================
# GATE 3 — SECURITY
# ============================================================

log ""
log "## GATE 3 — SECURITY"

if [ -f .env ]; then
  warn "MRF-SEC-001 — .env présent localement" "P2" "Security"
fi

git ls-files | grep -E '(^|/)\.env$|(^|/)\.env\.(local|production|staging|development|test|sentry-build-plugin)$' >/dev/null 2>&1
  fail "MRF-SEC-002 — fichier .env suivi par Git" "P0" "Security"
else
  pass "MRF-SEC-002 — aucun .env suivi par Git" "P0" "Security"
fi

if [ -f .gitignore ] && grep -qE '^\.env|\.env\*' .gitignore; then
  pass "MRF-SEC-003 — .env protégé par .gitignore" "P1" "Security"
else
  warn "MRF-SEC-003 — protection .env à vérifier" "P1" "Security"
fi

if grep -RInE \
  "password[[:space:]]*=[[:space:]]*['\"][^$]{8,}|api[_-]?key[[:space:]]*=[[:space:]]*['\"][^$]{10,}" \
  src 2>/dev/null | grep -q .; then
  fail "MRF-SEC-004 — secret potentiel dans le code" "P0" "Security"
else
  pass "MRF-SEC-004 — aucun secret évident détecté" "P0" "Security"
fi

# Cross-tenant audit — recherche des protections tenant
if grep -RIlE \
  "tenantId|tenant_id|organizationId|organization_id" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-SEC-005 — isolation tenant implémentée détectée" "P0" "Security"
else
  fail "MRF-SEC-005 — isolation tenant non détectée" "P0" "Security"
fi

# ============================================================
# GATE 4 — PRIVACY / DATA
# ============================================================

log ""
log "## GATE 4 — PRIVACY / DATA GOVERNANCE"

if [ -f prisma/schema.prisma ]; then
  if npx prisma validate > "$EVIDENCE_DIR/MRF-DATA-001.txt" 2>&1; then
    pass "MRF-DATA-001 — Prisma schema valide" "P1" "Data"
  else
    fail "MRF-DATA-001 — Prisma schema invalide" "P1" "Data"
    tail -20 "$EVIDENCE_DIR/MRF-DATA-001.txt" | tee -a "$REPORT"
  fi
else
  warn "MRF-DATA-001 — Prisma absent" "P1" "Data"
fi

if grep -RIlE \
  "delete|remove|purge|export|gdpr|rgpd" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-DATA-002 — mécanismes RGPD/suppression/export détectés" "P1" "Data"
else
  warn "MRF-DATA-002 — suppression/export RGPD non détecté" "P1" "Data"
fi

if grep -RIlE \
  "audit|auditTrail|AuditLog|securityLog" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-DATA-003 — audit trail détecté" "P1" "Data"
else
  warn "MRF-DATA-003 — audit trail non détecté" "P1" "Data"
fi

# ============================================================
# GATE 5 — AI SAFETY
# ============================================================

log ""
log "## GATE 5 — AI SAFETY"

if grep -RIlE \
  "openai|anthropic|llm|ai-assistant|generateText|chatCompletion" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-AI-001 — composants IA détectés" "P1" "AI Safety"
else
  warn "MRF-AI-001 — IA non détectée" "P2" "AI Safety"
fi

if grep -RIlE \
  "human.*valid|approval|approve|confirm|validation|validated" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-AI-002 — validation humaine détectée" "P0" "AI Safety"
else
  fail "MRF-AI-002 — validation humaine non détectée" "P0" "AI Safety"
fi

if grep -RIlE \
  "confidence|uncertainty|source|citation|evidence" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-AI-003 — traçabilité/confiance IA détectée" "P1" "AI Safety"
else
  warn "MRF-AI-003 — confiance/source IA non détectée" "P1" "AI Safety"
fi

# ============================================================
# GATE 6 — HUMAN VALIDATION
# ============================================================

log ""
log "## GATE 6 — HUMAN VALIDATION"

if [ -d "src/__tests__" ] || [ -d "__tests__" ]; then
  pass "MRF-HUMAN-001 — tests applicatifs présents" "P2" "Human"
else
  warn "MRF-HUMAN-001 — tests applicatifs absents" "P2" "Human"
fi

if grep -RIlE \
  "feedback|onboarding|help|support" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-HUMAN-002 — mécanismes utilisateur/support détectés" "P2" "Human"
else
  warn "MRF-HUMAN-002 — support utilisateur non détecté" "P2" "Human"
fi

# ============================================================
# GATE 7 — BUSINESS
# ============================================================

log ""
log "## GATE 7 — BUSINESS VALIDATION"

if grep -RIlE \
  "stripe|subscription|billing|checkout|invoice|payment" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-BIZ-001 — infrastructure billing détectée" "P1" "Business"
else
  warn "MRF-BIZ-001 — billing non détecté" "P1" "Business"
fi

if grep -RIlE \
  "plan|trial|upgrade|subscription" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-BIZ-002 — plans/abonnements détectés" "P1" "Business"
else
  warn "MRF-BIZ-002 — plans/abonnements non détectés" "P1" "Business"
fi

# ============================================================
# GATE 8 — OPERATIONS
# ============================================================

log ""
log "## GATE 8 — OPERATIONAL READINESS"

if grep -RIlE \
  "sentry|monitoring|metrics|health|healthcheck" \
  src 2>/dev/null | grep -q .; then
  pass "MRF-OPS-001 — monitoring/health détecté" "P1" "Operations"
else
  warn "MRF-OPS-001 — monitoring non détecté" "P1" "Operations"
fi

if [ -d ".github/workflows" ]; then
  pass "MRF-OPS-002 — CI/CD présent" "P1" "Operations"
else
  warn "MRF-OPS-002 — CI/CD absent" "P1" "Operations"
fi

if grep -RIlE \
  "backup|restore|rollback" \
  .github scripts src 2>/dev/null | grep -q .; then
  pass "MRF-OPS-003 — backup/restore/rollback détecté" "P1" "Operations"
else
  warn "MRF-OPS-003 — stratégie backup/restore à vérifier" "P1" "Operations"
fi

# ============================================================
# VS CODE / DOCKER CLEANUP
# ============================================================

log ""
log "## CONFIGURATION DEVELOPMENT"

if [ -f .vscode/tasks.json ]; then
  if grep -qE '"type"[[:space:]]*:[[:space:]]*"docker-(build|run)"' .vscode/tasks.json; then
    fail "MRF-DEV-001 — anciennes tâches docker-build/docker-run présentes" "P2" "Development"
  else
    pass "MRF-DEV-001 — tasks.json sans docker-build/docker-run" "P2" "Development"
  fi
fi

if [ -f .vscode/launch.json ]; then
  if grep -qE 'preLaunchTask.*docker-run' .vscode/launch.json; then
    fail "MRF-DEV-002 — launch.json référence docker-run" "P2" "Development"
  else
    pass "MRF-DEV-002 — launch.json sans docker-run" "P2" "Development"
  fi
fi

# ============================================================
# VERDICT
# ============================================================

log ""
log "============================================================"
log " FINAL VERDICT"
log "============================================================"

TOTAL=$((PASS + WARN + FAIL))

if [ "$P0" -gt 0 ]; then
  VERDICT_TEXT="NO-GO"
elif [ "$P1" -gt 0 ]; then
  VERDICT_TEXT="NO-GO"
elif [ "$FAIL" -gt 0 ]; then
  VERDICT_TEXT="PILOT-GO"
elif [ "$WARN" -gt 0 ]; then
  VERDICT_TEXT="PILOT-GO"
else
  VERDICT_TEXT="COMMERCIAL-GO"
fi

# SCALE-GO nécessite explicitement des preuves business humaines.
if [ "$VERDICT_TEXT" = "COMMERCIAL-GO" ]; then
  if [ ! -f "$ROOT/.mrf-scale-go" ]; then
    VERDICT_TEXT="COMMERCIAL-GO"
  else
    VERDICT_TEXT="SCALE-GO"
  fi
fi

log ""
log "PASS : $PASS"
log "WARN : $WARN"
log "FAIL : $FAIL"
log "P0   : $P0"
log "P1   : $P1"
log ""
log "VERDICT : $VERDICT_TEXT"

cat > "$VERDICT" <<EOF
{
  "framework": "MemoLib Readiness Framework",
  "version": "1.0",
  "timestamp": "$(date -Iseconds)",
  "verdict": "$VERDICT_TEXT",
  "pass": $PASS,
  "warn": $WARN,
  "fail": $FAIL,
  "p0": $P0,
  "p1": $P1,
  "report": "report.md",
  "evidence": "evidence/"
}
EOF

log ""
log "Rapport : $REPORT"
log "Verdict JSON : $VERDICT"
log "Preuves : $EVIDENCE_DIR"

if [ "$VERDICT_TEXT" = "NO-GO" ]; then
  exit 2
fi

exit 0
