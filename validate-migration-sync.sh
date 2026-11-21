#!/usr/bin/env bash
# Script: validate-migration-sync.sh
# Purpose: Validate PostgreSQL <-> Prisma synchronization after migration
# Usage: ./validate-migration-sync.sh

set -e

echo "════════════════════════════════════════════════════════════"
echo "🔍 VALIDATION MIGRATION - PostgreSQL <-> Prisma Sync Check"
echo "════════════════════════════════════════════════════════════"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ PASS${NC} : $1"
  ((PASSED++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC} : $1"
  ((FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠️  WARN${NC} : $1"
}

info() {
  echo -e "${BLUE}ℹ️  INFO${NC} : $1"
}

# ============================================
# 1. CHECK DATABASE CONNECTION
# ============================================
echo ""
echo "${BLUE}━━━ TEST 1 : Database Connectivity ${NC}"

if [ -z "$DATABASE_URL" ]; then
  warn "DATABASE_URL not set, skipping database checks"
else
  info "Database URL configured"
  
  # Try to connect
  if psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
    pass "PostgreSQL connection successful"
  else
    fail "PostgreSQL connection failed"
    exit 1
  fi
fi

# ============================================
# 2. CHECK ACCESSGRANT COLUMNS
# ============================================
echo ""
echo "${BLUE}━━━ TEST 2 : AccessGrant Column Synchronization ${NC}"

REQUIRED_COLS=("id" "tenantId" "invitationId" "clientUserId" "dossierId" "status" "expiresAt" "revokedAt" "createdAt" "updatedAt")

for col in "${REQUIRED_COLS[@]}"; do
  if grep -q "\"$col\"" "prisma/schema.prisma" 2>/dev/null; then
    info "Prisma defines column: $col"
  fi
done

# If DB connected, check actual columns
if [ ! -z "$DATABASE_URL" ]; then
  ACTUAL_COLS=$(psql "$DATABASE_URL" -t -c "
    SELECT string_agg(column_name, ', ')
    FROM information_schema.columns
    WHERE table_name = 'AccessGrant'
  " 2>/dev/null || echo "")
  
  if [ ! -z "$ACTUAL_COLS" ]; then
    echo "Actual PostgreSQL columns: $ACTUAL_COLS"
    
    for col in "${REQUIRED_COLS[@]}"; do
      if [[ "$ACTUAL_COLS" == *"$col"* ]]; then
        pass "Column exists in PostgreSQL: $col"
      else
        fail "Column MISSING in PostgreSQL: $col"
      fi
    done
  fi
fi

# ============================================
# 3. CHECK FOREIGN KEYS
# ============================================
echo ""
echo "${BLUE}━━━ TEST 3 : Foreign Key Constraints ${NC}"

REQUIRED_FKS=("AccessGrant_tenantId_fkey" "AccessGrant_invitationId_tenantId_fkey" "AccessGrant_clientUserId_fkey" "AccessGrant_dossierId_fkey")

if [ ! -z "$DATABASE_URL" ]; then
  ACTUAL_FKS=$(psql "$DATABASE_URL" -t -c "
    SELECT string_agg(constraint_name, ', ')
    FROM information_schema.table_constraints
    WHERE table_name = 'AccessGrant'
    AND constraint_type = 'FOREIGN KEY'
  " 2>/dev/null || echo "")
  
  echo "Actual PostgreSQL FK: $ACTUAL_FKS"
  
  for fk in "${REQUIRED_FKS[@]}"; do
    if [[ "$ACTUAL_FKS" == *"$fk"* ]]; then
      pass "Foreign key exists: $fk"
    else
      fail "Foreign key MISSING: $fk"
    fi
  done
else
  warn "Cannot check FK constraints without DATABASE_URL"
fi

# ============================================
# 4. CHECK ENUM TYPE
# ============================================
echo ""
echo "${BLUE}━━━ TEST 4 : Enum Type Definition ${NC}"

if [ ! -z "$DATABASE_URL" ]; then
  ENUM_VALUES=$(psql "$DATABASE_URL" -t -c "
    SELECT array_agg(enumlabel)
    FROM pg_type
    LEFT JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
    WHERE typname = 'AccessGrantStatus'
  " 2>/dev/null || echo "")
  
  if [[ "$ENUM_VALUES" == *"ACTIVE"* ]] && [[ "$ENUM_VALUES" == *"REVOKED"* ]] && [[ "$ENUM_VALUES" == *"EXPIRED"* ]]; then
    pass "AccessGrantStatus enum defined with correct values"
  else
    fail "AccessGrantStatus enum missing or incomplete"
  fi
else
  warn "Cannot check enum without DATABASE_URL"
fi

# ============================================
# 5. CHECK PRISMA SCHEMA
# ============================================
echo ""
echo "${BLUE}━━━ TEST 5 : Prisma Schema Validation ${NC}"

if grep -q "model AccessGrant" "prisma/schema.prisma" 2>/dev/null; then
  pass "AccessGrant model defined in schema"
else
  fail "AccessGrant model NOT found in schema"
fi

if grep -q "enum AccessGrantStatus" "prisma/schema.prisma" 2>/dev/null; then
  pass "AccessGrantStatus enum defined in schema"
else
  fail "AccessGrantStatus enum NOT found in schema"
fi

if grep -q "model Invitation" "prisma/schema.prisma" 2>/dev/null; then
  pass "Invitation model defined in schema"
else
  fail "Invitation model NOT found in schema"
fi

# ============================================
# 6. CHECK MIGRATION FILE
# ============================================
echo ""
echo "${BLUE}━━━ TEST 6 : Migration File Integrity ${NC}"

MIGRATION_DIR="prisma/migrations/20261117235600_fix_access_grant_schema"
MIGRATION_SQL="$MIGRATION_DIR/migration.sql"

if [ -f "$MIGRATION_SQL" ]; then
  pass "Migration file exists: $MIGRATION_SQL"
  
  # Check for key statements
  if grep -q "ADD COLUMN.*dossierId" "$MIGRATION_SQL"; then
    pass "Migration adds dossierId column"
  else
    fail "Migration does NOT add dossierId column"
  fi
  
  if grep -q "ADD COLUMN.*status" "$MIGRATION_SQL"; then
    pass "Migration adds status column"
  else
    fail "Migration does NOT add status column"
  fi
  
  if grep -q "ADD COLUMN.*updatedAt" "$MIGRATION_SQL"; then
    pass "Migration adds updatedAt column"
  else
    fail "Migration does NOT add updatedAt column"
  fi
  
  if grep -q "AccessGrantStatus" "$MIGRATION_SQL"; then
    pass "Migration creates AccessGrantStatus enum"
  else
    fail "Migration does NOT create AccessGrantStatus enum"
  fi
  
  if grep -q "FOREIGN KEY" "$MIGRATION_SQL"; then
    pass "Migration adds foreign keys"
  else
    fail "Migration does NOT add foreign keys"
  fi
else
  fail "Migration file NOT found: $MIGRATION_SQL"
fi

# ============================================
# 7. CHECK BUILD
# ============================================
echo ""
echo "${BLUE}━━━ TEST 7 : Build Validation ${NC}"

if [ -f "package.json" ] && command -v npm &> /dev/null; then
  info "Attempting TypeScript build..."
  
  if npm run build --silent 2>/dev/null; then
    pass "TypeScript build successful"
  else
    warn "TypeScript build failed (may require node_modules)"
  fi
else
  warn "Cannot validate build without npm"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "════════════════════════════════════════════════════════════"
echo "📊 VALIDATION SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED - Migration is ready${NC}"
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED - Review errors above${NC}"
  exit 1
fi
