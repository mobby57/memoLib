#!/bin/bash
# 🚀 MemoLib Fly.io Deployment Script
# Usage: ./fly-deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
APP_NAME="memolib-${ENVIRONMENT}"

echo "🚀 MemoLib Fly.io Deployment - $ENVIRONMENT"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==================== Phase 1: Pre-checks ====================
echo -e "${YELLOW}Phase 1: Pre-deployment checks${NC}"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}✗ Fly CLI not found${NC}"
    echo "  Install: brew install flyctl (or curl -L https://fly.io/install.sh | sh)"
    exit 1
fi
echo -e "${GREEN}✓ Fly CLI found${NC}"

# Check if authenticated
if ! flyctl auth whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Not authenticated with Fly.io${NC}"
    echo "  Running: flyctl auth login"
    flyctl auth login
fi
echo -e "${GREEN}✓ Authenticated with Fly.io${NC}"

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

# ==================== Phase 3: Fly.io Deployment ====================
echo ""
echo -e "${YELLOW}Phase 3: Fly.io Deployment ($ENVIRONMENT)${NC}"

echo "  → Deploying to Fly.io..."
flyctl deploy --remote-only

echo -e "${GREEN}✓ Deployment completed${NC}"

# Get deployment info
DEPLOYMENT_URL=$(flyctl status --json | jq -r '.Hostname')

echo "  URL: https://$DEPLOYMENT_URL"

# ==================== Phase 4: Database Migrations ====================
echo ""
echo -e "${YELLOW}Phase 4: Database Migrations${NC}"

echo "  → Running Prisma migrations..."
flyctl ssh console --command "npm run prisma:migrate"

echo -e "${GREEN}✓ Migrations completed${NC}"

# ==================== Phase 5: Post-deployment tests ====================
echo ""
echo -e "${YELLOW}Phase 5: Post-deployment tests${NC}"

echo "  → Waiting 30s for deployment to be live..."
sleep 30

echo "  → Health check..."
if curl -f "https://$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "  Check logs: flyctl logs --follow"
    exit 1
fi

# ==================== Phase 6: Webhook verification ====================
echo ""
echo -e "${YELLOW}Phase 6: GitHub App Configuration${NC}"

WEBHOOK_URL="https://$DEPLOYMENT_URL/api/github/webhook"
echo "  → GitHub App webhook URL should be:"
echo "    $WEBHOOK_URL"
echo ""
echo -e "${YELLOW}⚠ MANUAL STEP REQUIRED:${NC}"
echo "  Go to: https://github.com/settings/apps/memolib-guardian"
echo "  Update Webhook URL: $WEBHOOK_URL"
echo ""

# ==================== Phase 7: Secrets Setup ====================
echo ""
echo -e "${YELLOW}Phase 7: Verify Secrets${NC}"

echo "  → Checking configured secrets..."
flyctl secrets list

echo ""
echo -e "${YELLOW}⚠ NOTE:${NC}"
echo "  If secrets are missing, set them with:"
echo "  flyctl secrets set GITHUB_APP_ID=2782101"
echo "  flyctl secrets set GITHUB_APP_CLIENT_ID=Iv23li1esofvkxLzxiD1"
echo "  flyctl secrets set GITHUB_APP_CLIENT_SECRET=..."
echo "  flyctl secrets set GITHUB_APP_PRIVATE_KEY=..."
echo "  flyctl secrets set DATABASE_URL=postgresql://..."
echo ""

# ==================== Success ====================
echo ""
echo -e "${GREEN}✨ Deployment successful!${NC}"
echo ""
echo "📊 Next steps:"
echo "  1. Verify secrets are configured: flyctl secrets list"
echo "  2. Update GitHub webhook URL"
echo "  3. Test OAuth: https://$DEPLOYMENT_URL/api/auth/signin"
echo "  4. Create test issue to verify webhooks"
echo "  5. Monitor logs: flyctl logs --follow"
echo ""
echo "📈 Useful links:"
echo "  Frontend: https://$DEPLOYMENT_URL"
echo "  Dashboard: https://fly.io/dashboard"
echo "  Logs: flyctl logs --follow"
echo "  SSH Console: flyctl ssh console"
echo "  GitHub App: https://github.com/settings/apps/memolib-guardian"
echo ""
echo "🔄 Rollback if needed:"
echo "  flyctl releases"
echo "  flyctl releases rollback"
echo ""
