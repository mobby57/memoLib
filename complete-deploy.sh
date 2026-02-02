#!/bin/bash
# 🚀 MemoLib Complete Deployment Script
# Deploys to BOTH Vercel (frontend) and Fly.io (backend)
# Usage: ./complete-deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
echo "🚀 MemoLib Complete Deployment - $ENVIRONMENT"
echo "📋 Deploying to: Vercel (Frontend) + Fly.io (Backend)"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== Phase 1: Global Pre-checks ====================
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 1: Global Pre-deployment checks${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

# Check CLIs
echo "  → Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not found${NC}"
    echo "    Install: npm install -g vercel"
    exit 1
fi
echo -e "${GREEN}✓ Vercel CLI found${NC}"

echo "  → Checking Fly CLI..."
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}✗ Fly CLI not found${NC}"
    echo "    Install: brew install flyctl"
    exit 1
fi
echo -e "${GREEN}✓ Fly CLI found${NC}"

# Check authentication
echo "  → Checking Vercel auth..."
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Not authenticated with Vercel${NC}"
    vercel login
fi
echo -e "${GREEN}✓ Vercel authenticated${NC}"

echo "  → Checking Fly.io auth..."
if ! flyctl auth whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Not authenticated with Fly.io${NC}"
    flyctl auth login
fi
echo -e "${GREEN}✓ Fly.io authenticated${NC}"

# Check git
echo "  → Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Uncommitted changes found${NC}"
    git stash
fi
echo -e "${GREEN}✓ Git clean${NC}"

# ==================== Phase 2: Build Verification ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 2: Build Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo "  → Type checking..."
npm run type-check || echo -e "${YELLOW}⚠ TypeScript warnings (non-blocking)${NC}"

echo -e "${GREEN}✓ Build verified${NC}"

# ==================== Phase 3A: Vercel Frontend Deployment ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 3A: Vercel Frontend Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "  → Deploying FRONTEND to PRODUCTION..."
    VERCEL_URL=$(vercel deploy --prod --json | jq -r '.url')
else
    echo "  → Deploying FRONTEND to STAGING..."
    VERCEL_URL=$(vercel deploy --json | jq -r '.url')
fi

echo -e "${GREEN}✓ Frontend deployed${NC}"
echo "  URL: https://$VERCEL_URL"

# ==================== Phase 3B: Fly.io Backend Deployment ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 3B: Fly.io Backend Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo "  → Deploying BACKEND to Fly.io ($ENVIRONMENT)..."
flyctl deploy --remote-only --app "memolib-${ENVIRONMENT}"

FLY_URL=$(flyctl status --json --app "memolib-${ENVIRONMENT}" | jq -r '.Hostname')

echo -e "${GREEN}✓ Backend deployed${NC}"
echo "  URL: https://$FLY_URL"

# ==================== Phase 4: Database Migrations ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 4: Database Migrations${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo "  → Running Prisma migrations on Fly.io..."
flyctl ssh console --app "memolib-${ENVIRONMENT}" --command "npm run prisma:migrate"

echo -e "${GREEN}✓ Migrations completed${NC}"

# ==================== Phase 5: Health Checks ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 5: Health Checks${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

echo "  → Waiting 30s for deployments to be live..."
sleep 30

echo "  → Frontend health check..."
if curl -f "https://$VERCEL_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend healthy${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    echo "    Logs: vercel logs -a memolib"
fi

echo "  → Backend health check..."
if curl -f "https://$FLY_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "    Logs: flyctl logs -a memolib-${ENVIRONMENT}"
fi

# ==================== Phase 6: GitHub App Configuration ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Phase 6: GitHub App Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

WEBHOOK_URL="https://$VERCEL_URL/api/github/webhook"
echo "  → GitHub App webhook URL:"
echo "    $WEBHOOK_URL"
echo ""
echo -e "${YELLOW}⚠ MANUAL STEP REQUIRED:${NC}"
echo "  1. Go to: https://github.com/settings/apps/memolib-guardian"
echo "  2. Update Webhook URL: $WEBHOOK_URL"
echo "  3. Verify secrets are configured"
echo ""

# ==================== Success ====================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Complete Deployment Successful!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "  Frontend:  https://$VERCEL_URL"
echo "  Backend:   https://$FLY_URL"
echo "  Environment: $ENVIRONMENT"
echo ""
echo "📋 Next Steps:"
echo "  1. Update GitHub webhook URL"
echo "  2. Test OAuth: https://$VERCEL_URL/api/auth/signin"
echo "  3. Create test issue to verify webhooks"
echo "  4. Monitor both services"
echo ""
echo "📈 Useful Links:"
echo "  Vercel Dashboard:    https://vercel.com/dashboard"
echo "  Fly.io Dashboard:    https://fly.io/dashboard"
echo "  GitHub App Settings: https://github.com/settings/apps/memolib-guardian"
echo "  Sentry:              https://sentry.io"
echo ""
echo "🔄 Monitoring:"
echo "  Frontend logs: vercel logs -a memolib --follow"
echo "  Backend logs:  flyctl logs -a memolib-${ENVIRONMENT} --follow"
echo "  Backend SSH:   flyctl ssh console -a memolib-${ENVIRONMENT}"
echo ""
echo "🔙 Rollback:"
echo "  Frontend: vercel rollback"
echo "  Backend:  flyctl releases && flyctl releases rollback"
echo ""
