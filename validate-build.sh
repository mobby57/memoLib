#!/bin/bash
# MemoLib Build Validation & Quick Fixes
# Cette script valide la structure et applique les corrections rapides

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}🚀 MemoLib Build Validation Script${NC}\n"

# 1. Check Flask Backend
echo -e "${BOLD}1. Checking Flask Backend...${NC}"
if ! curl -s http://localhost:5000/ > /dev/null 2>&1; then
    echo -e "${RED}✗ Flask backend not responding at :5000${NC}"
    echo -e "${YELLOW}  → Starting backend: npm run dev:backend${NC}"
else
    echo -e "${GREEN}✓ Flask backend is running${NC}"

    # Test health endpoint
    HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null || echo "NOT_FOUND")
    if [ "$HEALTH" = "NOT_FOUND" ]; then
        echo -e "${YELLOW}  ⚠ Health endpoint missing, needs implementation${NC}"
    else
        echo -e "${GREEN}  ✓ Health endpoint available${NC}"
    fi
fi
echo ""

# 2. Check Frontend
echo -e "${BOLD}2. Checking Frontend...${NC}"
if ! curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${RED}✗ Frontend not responding at :3000${NC}"
    echo -e "${YELLOW}  → Starting frontend: npm run dev${NC}"
else
    echo -e "${GREEN}✓ Frontend is running${NC}"
fi
echo ""

# 3. Check TypeScript Config
echo -e "${BOLD}3. Checking TypeScript Config...${NC}"
TSC_CONFIG="src/frontend/tsconfig.json"
if grep -q "skipLibCheck" "$TSC_CONFIG"; then
    echo -e "${GREEN}✓ skipLibCheck is configured${NC}"
else
    echo -e "${RED}✗ skipLibCheck not found in tsconfig.json${NC}"
    echo -e "${YELLOW}  → Add: \"skipLibCheck\": true${NC}"
fi
echo ""

# 4. Check Environment Variables
echo -e "${BOLD}4. Checking Environment Variables...${NC}"
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ .env.local not found${NC}"
    echo -e "${YELLOW}  → Copy .env.example to .env.local and fill in secrets${NC}"
else
    echo -e "${GREEN}✓ .env.local exists${NC}"

    # Check critical vars
    MISSING=()
    for VAR in NEXTAUTH_SECRET NEXTAUTH_URL DATABASE_URL; do
        if ! grep -q "^$VAR=" "$ENV_FILE"; then
            MISSING+=("$VAR")
        fi
    done

    if [ ${#MISSING[@]} -gt 0 ]; then
        echo -e "${YELLOW}  ⚠ Missing variables: ${MISSING[*]}${NC}"
    else
        echo -e "${GREEN}  ✓ Critical variables configured${NC}"
    fi
fi
echo ""

# 5. Check Database Schema
echo -e "${BOLD}5. Checking Database Schema...${NC}"
SCHEMA="prisma/schema.prisma"
if [ -f "$SCHEMA" ]; then
    INDEX_COUNT=$(grep -c "@@index" "$SCHEMA" || echo "0")
    echo -e "${GREEN}✓ Database schema found (${INDEX_COUNT} indexes)${NC}"
    if [ "$INDEX_COUNT" -lt 5 ]; then
        echo -e "${YELLOW}  ⚠ Low number of indexes (${INDEX_COUNT} < 5)${NC}"
    fi
else
    echo -e "${RED}✗ prisma/schema.prisma not found${NC}"
fi
echo ""

# 6. Check CORS Configuration
echo -e "${BOLD}6. Checking CORS Configuration...${NC}"
FLASK_APP="backend-python/app.py"
if grep -q "CORS(app)" "$FLASK_APP"; then
    if grep -q "origins.*localhost" "$FLASK_APP"; then
        echo -e "${GREEN}✓ CORS properly configured with origins${NC}"
    else
        echo -e "${YELLOW}⚠ CORS is too permissive (accepts all origins)${NC}"
        echo -e "${YELLOW}  → Restrict to: http://localhost:3000 in dev${NC}"
    fi
else
    echo -e "${RED}✗ CORS not configured${NC}"
fi
echo ""

# 7. Check Node Modules
echo -e "${BOLD}7. Checking Dependencies...${NC}"
if [ -d "src/frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Frontend node_modules exists${NC}"
else
    echo -e "${RED}✗ Frontend node_modules missing${NC}"
    echo -e "${YELLOW}  → Run: cd src/frontend && npm install${NC}"
fi
echo ""

# 8. Summary & Recommendations
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}📋 RECOMMENDATIONS:${NC}\n"

echo -e "${YELLOW}CRITICAL (Fix Now):${NC}"
echo "  1. Add /health endpoint to backend-python/app.py"
echo "  2. Enable skipLibCheck in src/frontend/tsconfig.json"
echo "  3. Create .env.local with NEXTAUTH_SECRET"
echo ""

echo -e "${YELLOW}IMPORTANT (This Week):${NC}"
echo "  4. Secure CORS configuration"
echo "  5. Add database indexes for frequently filtered columns"
echo "  6. Document API endpoints"
echo ""

echo -e "${YELLOW}GOOD-TO-HAVE (Soon):${NC}"
echo "  7. Setup Sentry monitoring"
echo "  8. Add E2E tests (Playwright)"
echo "  9. Optimize bundle size"
echo ""

echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Validation complete!${NC}\n"

# Quick Fix Offers
echo -e "${BOLD}Quick Fixes Available:${NC}"
echo ""
echo "1. Add Flask health endpoints:"
echo "   ${GREEN}bash scripts/fix-flask-health.sh${NC}"
echo ""
echo "2. Update TypeScript config:"
echo "   ${GREEN}bash scripts/fix-tsconfig.sh${NC}"
echo ""
echo "3. Generate .env.local template:"
echo "   ${GREEN}cp .env.example .env.local${NC}"
echo ""
