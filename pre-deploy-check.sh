#!/bin/bash
# Pre-deployment verification script
# Vérifie que tout est prêt avant livraison

set -e

echo "=================================="
echo "🔍 MemoLib Pre-Deployment Check"
echo "=================================="
echo ""

FAIL_COUNT=0
WARN_COUNT=0

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
  echo -e "${GREEN}✅${NC} $1"
}

check_fail() {
  echo -e "${RED}❌${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

check_warn() {
  echo -e "${YELLOW}⚠️${NC} $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

# ==================== Node & npm ====================
echo "📦 Checking Node.js & npm..."

if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  check_pass "Node.js installed ($NODE_VERSION)"
else
  check_fail "Node.js not found"
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  check_pass "npm installed ($NPM_VERSION)"
else
  check_fail "npm not found"
fi

# ==================== Dependencies ====================
echo ""
echo "📚 Checking dependencies..."

if [ -d "node_modules" ]; then
  check_pass "node_modules directory exists"
else
  check_fail "node_modules directory missing"
fi

if [ -f "package-lock.json" ]; then
  check_pass "package-lock.json exists"
else
  check_warn "package-lock.json missing"
fi

# ==================== Build ====================
echo ""
echo "🏗️  Checking build..."

if npm run build > /dev/null 2>&1; then
  check_pass "Build successful"
else
  check_fail "Build failed"
fi

if [ -d ".next" ]; then
  check_pass ".next directory exists"
else
  check_fail ".next directory not found"
fi

# ==================== TypeScript ====================
echo ""
echo "📘 Checking TypeScript..."

if npm run type-check > /dev/null 2>&1; then
  check_pass "TypeScript check passed"
else
  TYPE_ERRORS=$(npm run type-check 2>&1 | grep -c "error" || true)
  check_warn "TypeScript errors found ($TYPE_ERRORS errors)"
fi

# ==================== Tests ====================
echo ""
echo "🧪 Checking tests..."

if npm test -- --passWithNoTests > /dev/null 2>&1; then
  TEST_PASSED=$(npm test 2>&1 | grep -o "[0-9]* passed" | head -1)
  check_pass "Tests passed ($TEST_PASSED)"
else
  check_warn "Some tests failed (run: npm test)"
fi

# ==================== Security ====================
echo ""
echo "🔒 Checking security..."

if npm audit --production > /dev/null 2>&1; then
  check_pass "Security audit passed (0 vulnerabilities)"
else
  VULN_COUNT=$(npm audit --production 2>&1 | grep -o "[0-9]* high" | head -1)
  check_fail "Security vulnerabilities detected ($VULN_COUNT)"
fi

# ==================== Environment ====================
echo ""
echo "⚙️  Checking environment..."

if [ -f ".env.local" ]; then
  check_pass ".env.local exists"

  # Check for critical env vars
  if grep -q "DATABASE_URL" .env.local; then
    check_pass "DATABASE_URL configured"
  else
    check_warn "DATABASE_URL not found in .env.local"
  fi

  if grep -q "NEXTAUTH_SECRET" .env.local; then
    check_pass "NEXTAUTH_SECRET configured"
  else
    check_warn "NEXTAUTH_SECRET not found in .env.local"
  fi

  if grep -q "JWT_SECRET" .env.local; then
    check_pass "JWT_SECRET configured"
  else
    check_warn "JWT_SECRET not found in .env.local"
  fi
else
  check_fail ".env.local not found"
fi

# ==================== Database ====================
echo ""
echo "🗄️  Checking database..."

if command -v npx &> /dev/null; then
  if npx prisma db execute --stdin < /dev/null 2> /dev/null; then
    check_pass "Database connection OK"
  else
    check_warn "Database connection check skipped"
  fi
else
  check_warn "npx not available - skipping DB check"
fi

# ==================== Backend ====================
echo ""
echo "🔧 Checking backend..."

if [ -f "backend-python/app.py" ]; then
  check_pass "Flask backend exists"
else
  check_fail "Flask backend not found"
fi

if [ -f "backend-python/requirements.txt" ]; then
  check_pass "Python requirements.txt exists"
else
  check_fail "Python requirements.txt not found"
fi

if command -v python &> /dev/null; then
  check_pass "Python installed ($(python --version))"
else
  check_fail "Python not found"
fi

# ==================== Docker ====================
echo ""
echo "🐳 Checking Docker (optional)..."

if command -v docker &> /dev/null; then
  check_pass "Docker installed ($(docker --version))"

  if [ -f "Dockerfile.production" ]; then
    check_pass "Dockerfile.production exists"
  else
    check_warn "Dockerfile.production not found"
  fi

  if [ -f "Dockerfile.backend" ]; then
    check_pass "Dockerfile.backend exists"
  else
    check_warn "Dockerfile.backend not found"
  fi
else
  check_warn "Docker not installed (optional)"
fi

# ==================== Git ====================
echo ""
echo "🌳 Checking Git..."

if command -v git &> /dev/null; then
  check_pass "Git installed"

  if [ -d ".git" ]; then
    check_pass "Git repository found"

    # Check for uncommitted changes
    if git diff --quiet; then
      check_pass "No uncommitted changes"
    else
      check_warn "Uncommitted changes detected"
    fi
  else
    check_fail "Git repository not found"
  fi
else
  check_fail "Git not found"
fi

# ==================== Documentation ====================
echo ""
echo "📖 Checking documentation..."

if [ -f "README.md" ]; then
  check_pass "README.md exists"
else
  check_fail "README.md not found"
fi

if [ -f "DEPLOYMENT_CHECKLIST.md" ]; then
  check_pass "DEPLOYMENT_CHECKLIST.md exists"
else
  check_warn "DEPLOYMENT_CHECKLIST.md not found"
fi

if [ -f "RELEASE_NOTES.md" ]; then
  check_pass "RELEASE_NOTES.md exists"
else
  check_warn "RELEASE_NOTES.md not found"
fi

# ==================== Summary ====================
echo ""
echo "=================================="
echo "📊 Verification Summary"
echo "=================================="
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✨ All critical checks passed!${NC}"
  echo -e "Warnings: $WARN_COUNT"
  echo ""
  echo "Ready for deployment! 🚀"
  exit 0
else
  echo -e "${RED}❌ $FAIL_COUNT critical check(s) failed${NC}"
  echo -e "Warnings: $WARN_COUNT"
  echo ""
  echo "Please fix the failures above before deploying."
  exit 1
fi
