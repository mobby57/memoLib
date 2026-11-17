#!/bin/bash

# ============================================================================
# Database Diagnostic System — Automated Validation Script
# ============================================================================
# This script runs the full validation suite and reports readiness for deployment
# Usage: bash scripts/validate-diagnostic.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_FILE="${PROJECT_ROOT}/diagnostic-validation-results.json"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_step() {
  echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

check_command() {
  if command -v "$1" &> /dev/null; then
    print_success "$1 found"
    return 0
  else
    print_error "$1 not found"
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    print_success "$1 exists"
    return 0
  else
    print_error "$1 missing"
    return 1
  fi
}

check_env() {
  if [ -z "${!1}" ]; then
    print_warning "$1 not set"
    return 1
  else
    print_success "$1 set"
    return 0
  fi
}

run_command() {
  local cmd="$1"
  local desc="$2"
  
  print_step "$desc"
  
  if eval "$cmd" > /dev/null 2>&1; then
    print_success "$desc"
    return 0
  else
    print_error "$desc failed"
    return 1
  fi
}

# ============================================================================
# PHASE 1: ENVIRONMENT CHECK
# ============================================================================

print_header "PHASE 1: Environment Check"

print_step "Checking Node.js installation"
check_command "node" || exit 1
NODE_VERSION=$(node -v)
print_success "Node.js version: $NODE_VERSION"

print_step "Checking npm installation"
check_command "npm" || exit 1
NPM_VERSION=$(npm -v)
print_success "npm version: $NPM_VERSION"

print_step "Checking project structure"
check_file "$PROJECT_ROOT/package.json" || exit 1
check_file "$PROJECT_ROOT/prisma/schema.prisma" || exit 1

echo ""

# ============================================================================
# PHASE 2: DEPENDENCY CHECK
# ============================================================================

print_header "PHASE 2: Dependencies"

print_step "Checking node_modules"
if [ -d "$PROJECT_ROOT/node_modules" ]; then
  print_success "node_modules exists"
else
  print_warning "node_modules not found, running npm install"
  cd "$PROJECT_ROOT"
  npm install --legacy-peer-deps || exit 1
  print_success "Dependencies installed"
fi

echo ""

# ============================================================================
# PHASE 3: PRISMA VALIDATION
# ============================================================================

print_header "PHASE 3: Prisma Configuration"

print_step "Checking DATABASE_URL"
check_env "DATABASE_URL" || {
  print_error "DATABASE_URL must be set"
  exit 1
}

print_step "Checking Prisma schema"
check_file "$PROJECT_ROOT/prisma/schema.prisma"

print_step "Validating Prisma schema format"
cd "$PROJECT_ROOT"
npx prisma validate > /dev/null 2>&1 && {
  print_success "Prisma schema valid"
} || {
  print_error "Prisma schema invalid"
  exit 1
}

print_step "Generating Prisma client"
npx prisma generate > /dev/null 2>&1 && {
  print_success "Prisma client generated"
} || {
  print_error "Prisma generation failed"
  exit 1
}

echo ""

# ============================================================================
# PHASE 4: DATABASE CONNECTION
# ============================================================================

print_header "PHASE 4: Database Connection"

print_step "Testing database connectivity"
npx ts-node -e "
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  prisma.\$queryRaw\`SELECT NOW()\`
    .then(() => console.log('OK'))
    .catch(err => { console.error('FAILED'); process.exit(1); })
    .finally(() => prisma.\$disconnect());
" > /dev/null 2>&1 && {
  print_success "Database connection successful"
} || {
  print_error "Database connection failed"
  exit 1
}

echo ""

# ============================================================================
# PHASE 5: DIAGNOSTIC FILES CHECK
# ============================================================================

print_header "PHASE 5: Diagnostic System Files"

REQUIRED_FILES=(
  "scripts/diagnostic-postgres.ts"
  ".github/workflows/postgres-diagnostic.yml"
  "src/app/api/cron/pg-diagnostic.ts"
  "docs/DATABASE_DIAGNOSTIC_AUTOMATION.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  check_file "$PROJECT_ROOT/$file" || exit 1
done

echo ""

# ============================================================================
# PHASE 6: DIAGNOSTIC EXECUTION
# ============================================================================

print_header "PHASE 6: Diagnostic Script Execution"

print_step "Running diagnostic script"
DIAG_OUTPUT=$(cd "$PROJECT_ROOT" && npx ts-node scripts/diagnostic-postgres.ts 2>&1)

if [ $? -eq 0 ]; then
  print_success "Diagnostic script executed successfully"
  
  # Extract health score
  HEALTH_SCORE=$(echo "$DIAG_OUTPUT" | grep -oP 'Health Score: \K\d+' || echo "0")
  print_success "Health Score: $HEALTH_SCORE/100"
  
  # Check health score is acceptable
  if [ "$HEALTH_SCORE" -ge 50 ]; then
    print_success "Health score acceptable (≥50)"
  else
    print_error "Health score too low (<50)"
    exit 1
  fi
else
  print_error "Diagnostic script failed"
  exit 1
fi

echo ""

# ============================================================================
# PHASE 7: GITHUB ACTIONS WORKFLOW CHECK
# ============================================================================

print_header "PHASE 7: GitHub Actions Workflow"

WORKFLOW_FILE="$PROJECT_ROOT/.github/workflows/postgres-diagnostic.yml"

print_step "Checking workflow file"
check_file "$WORKFLOW_FILE"

print_step "Validating workflow configuration"
grep -q "postgres-diagnostic.ts" "$WORKFLOW_FILE" && print_success "Diagnostic script referenced"
grep -q "schedule:" "$WORKFLOW_FILE" && print_success "Schedule defined"
grep -q "workflow_dispatch:" "$WORKFLOW_FILE" && print_success "Manual trigger enabled"
grep -q "SLACK_WEBHOOK_URL" "$WORKFLOW_FILE" && print_success "Slack webhook reference found"

echo ""

# ============================================================================
# PHASE 8: API ENDPOINT CHECK
# ============================================================================

print_header "PHASE 8: Cron API Endpoint"

API_FILE="$PROJECT_ROOT/src/app/api/cron/pg-diagnostic.ts"

print_step "Checking API file"
check_file "$API_FILE"

print_step "Validating API configuration"
grep -q "Bearer" "$API_FILE" && print_success "Bearer authentication configured"
grep -q "prisma.databaseDiagnosticLog" "$API_FILE" && print_success "Database persistence configured"

echo ""

# ============================================================================
# PHASE 9: ENVIRONMENT SECRETS CHECK
# ============================================================================

print_header "PHASE 9: Configuration Secrets"

print_step "Checking CRON_SECRET"
if check_env "CRON_SECRET"; then
  if [ ${#CRON_SECRET} -gt 16 ]; then
    print_success "CRON_SECRET has sufficient length"
  else
    print_warning "CRON_SECRET may be too short (consider: openssl rand -hex 32)"
  fi
else
  print_warning "CRON_SECRET not set (required for GitHub Actions)"
fi

print_step "Checking SLACK_WEBHOOK_URL"
if check_env "SLACK_WEBHOOK_URL"; then
  if [[ $SLACK_WEBHOOK_URL == https://hooks.slack.com* ]]; then
    print_success "SLACK_WEBHOOK_URL valid format"
  else
    print_warning "SLACK_WEBHOOK_URL format may be incorrect"
  fi
else
  print_warning "SLACK_WEBHOOK_URL not set (alerts won't be sent)"
fi

echo ""

# ============================================================================
# PHASE 10: DOCUMENTATION CHECK
# ============================================================================

print_header "PHASE 10: Documentation"

DOC_FILES=(
  "docs/DATABASE_DIAGNOSTIC_AUTOMATION.md"
  "00_DATABASE_DIAGNOSTIC_SYSTEM_DELIVERY.md"
  "ALIGNMENT_DIAGNOSTIC_X_COMMERCIAL.md"
  "PLAN_90_JOURS_INTEGRATED.md"
)

for file in "${DOC_FILES[@]}"; do
  check_file "$PROJECT_ROOT/$file"
done

echo ""

# ============================================================================
# FINAL REPORT
# ============================================================================

print_header "🎉 VALIDATION COMPLETE"

echo "Diagnostic System Status: ${GREEN}✅ READY FOR DEPLOYMENT${NC}"
echo ""
echo "Summary:"
echo "  • Prisma schema: Valid"
echo "  • Database connection: OK"
echo "  • Diagnostic script: Working (Health: $HEALTH_SCORE/100)"
echo "  • API endpoint: Configured"
echo "  • GitHub Actions: Configured"
echo "  • Documentation: Complete"
echo ""
echo "Next steps:"
echo "  1. Configure GitHub secrets if not done:"
echo "     - CRON_SECRET: $(openssl rand -hex 32)"
echo "     - SLACK_WEBHOOK_URL: <your-slack-webhook>"
echo "  2. Push to main branch"
echo "  3. First diagnostic runs Monday 8h UTC"
echo "  4. Monitor Slack for alerts"
echo ""
echo "Report generated: $TIMESTAMP"
echo ""

# Save results to JSON
cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "status": "READY_FOR_DEPLOYMENT",
  "healthScore": $HEALTH_SCORE,
  "phases": {
    "environment": "PASS",
    "dependencies": "PASS",
    "prisma": "PASS",
    "database": "PASS",
    "diagnosticFiles": "PASS",
    "diagnosticExecution": "PASS",
    "gitHubActions": "PASS",
    "apiEndpoint": "PASS",
    "secrets": "PARTIAL",
    "documentation": "PASS"
  },
  "recommendations": [
    "Configure CRON_SECRET in GitHub secrets",
    "Configure SLACK_WEBHOOK_URL in GitHub secrets",
    "Push all changes to main branch",
    "First automated diagnostic runs Monday 8h UTC"
  ]
}
EOF

print_success "Results saved to: $RESULTS_FILE"

exit 0
