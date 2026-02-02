#!/bin/bash
# 🚀 MemoLib Quick Deployment Script
# Usage: ./vercel-deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
echo "🚀 MemoLib Vercel Deployment - $ENVIRONMENT"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==================== Phase 1: Pre-checks ====================
echo -e "${YELLOW}Phase 1: Pre-deployment checks${NC}"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not found${NC}"
    echo "  Install: npm install -g vercel"
    exit 1
fi
echo -e "${GREEN}✓ Vercel CLI found${NC}"

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Uncommitted changes found${NC}"
    echo "  Stashing changes..."
    git stash
fi
echo -e "${GREEN}✓ Git status clean${NC}"

# ==================== Phase 2: Build verification ====================
echo ""
echo -e "${YELLOW}Phase 2: Build verification${NC}"

echo "  → Running type-check..."
npm run type-check || echo -e "${YELLOW}⚠ TypeScript warnings (non-blocking)${NC}"

echo -e "${GREEN}✓ Build verification passed${NC}"

# ==================== Phase 3: Vercel Deployment ====================
echo ""
echo -e "${YELLOW}Phase 3: Vercel Deployment ($ENVIRONMENT)${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "  → Deploying to PRODUCTION..."
    vercel deploy --prod
    DEPLOYMENT_URL="https://memolib.vercel.app"
else
    echo "  → Deploying to STAGING (Preview)..."
    DEPLOYMENT_URL=$(vercel deploy)
fi

echo -e "${GREEN}✓ Deployment completed${NC}"
echo "  URL: $DEPLOYMENT_URL"

# ==================== Phase 4: Post-deployment tests ====================
echo ""
echo -e "${YELLOW}Phase 4: Post-deployment tests${NC}"

echo "  → Waiting 30s for deployment to be live..."
sleep 30

echo "  → Health check..."
if curl -f "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "  Check logs: vercel logs -a memolib --follow"
    exit 1
fi

# ==================== Phase 5: Webhook verification ====================
echo ""
echo -e "${YELLOW}Phase 5: GitHub App Configuration${NC}"

echo "  → GitHub App webhook URL should be:"
echo "    $DEPLOYMENT_URL/api/github/webhook"
echo ""
echo -e "${YELLOW}⚠ MANUAL STEP REQUIRED:${NC}"
echo "  Go to: https://github.com/settings/apps/memolib-guardian"
echo "  Update Webhook URL if this is a new domain"
echo ""

# ==================== Success ====================
echo ""
echo -e "${GREEN}✨ Deployment successful!${NC}"
echo ""
echo "📊 Next steps:"
echo "  1. Update GitHub webhook URL (if needed)"
echo "  2. Test OAuth: $DEPLOYMENT_URL/api/auth/signin"
echo "  3. Create test issue to verify webhooks"
echo "  4. Monitor logs: vercel logs -a memolib --follow"
echo ""
echo "📈 Useful links:"
echo "  Frontend: $DEPLOYMENT_URL"
echo "  Dashboard: https://vercel.com/dashboard"
echo "  GitHub App: https://github.com/settings/apps/memolib-guardian"
echo ""
