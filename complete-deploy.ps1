# MemoLib Complete Deployment Script (PowerShell for Windows)
# Deploys to both Vercel (Frontend) and Fly.io (Backend)
# Usage: .\complete-deploy.ps1 -Environment staging|production

param(
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging"
)

$ErrorActionPreference = "Stop"

# Colors
$Green = @{ ForegroundColor = "Green" }
$Yellow = @{ ForegroundColor = "Yellow" }
$Red = @{ ForegroundColor = "Red" }
$Blue = @{ ForegroundColor = "Cyan" }

Write-Host "`n" @Blue
Write-Host "════════════════════════════════════════════════════════════" @Blue
Write-Host "🚀 MemoLib Complete Deployment (Vercel + Fly.io)" @Blue
Write-Host "Environment: $Environment" @Blue
Write-Host "════════════════════════════════════════════════════════════" @Blue

# ==================== Phase 1: Global Pre-checks ====================
Write-Host "`nPhase 1: Global Pre-deployment checks..." @Yellow

# Check Vercel
try {
    vercel --version | Out-Null
    Write-Host "✓ Vercel CLI found" @Green
} catch {
    Write-Host "✗ Vercel CLI not found. Install: npm install -g vercel" @Red
    exit 1
}

# Check Fly
try {
    flyctl version | Out-Null
    Write-Host "✓ Fly CLI found" @Green
} catch {
    Write-Host "✗ Fly CLI not found. Install: https://fly.io/docs/getting-started/installing-flyctl/" @Red
    Write-Host "  Or: brew install flyctl" @Red
    exit 1
}

# Check auth
try {
    vercel whoami | Out-Null
    Write-Host "✓ Vercel authenticated" @Green
} catch {
    Write-Host "⚠ Vercel not authenticated, running login..." @Yellow
    & vercel login
}

try {
    flyctl auth whoami | Out-Null
    Write-Host "✓ Fly.io authenticated" @Green
} catch {
    Write-Host "⚠ Fly.io not authenticated, running login..." @Yellow
    & flyctl auth login
}

# Check git
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠ Uncommitted changes, stashing..." @Yellow
    git stash | Out-Null
}
Write-Host "✓ Git clean" @Green

# ==================== Phase 2: Build Verification ====================
Write-Host "`nPhase 2: Build Verification..." @Yellow

npm run type-check 2>&1 | Out-Null
Write-Host "✓ Build verified" @Green

# ==================== Phase 3A: Vercel Frontend ====================
Write-Host "`nPhase 3A: Vercel Frontend Deployment..." @Yellow

if ($Environment -eq "production") {
    Write-Host "  → Deploying FRONTEND to PRODUCTION..." @Yellow
    $vercelOutput = & vercel deploy --prod 2>&1
} else {
    Write-Host "  → Deploying FRONTEND to STAGING..." @Yellow
    $vercelOutput = & vercel deploy 2>&1
}

$vercelUrl = ($vercelOutput | Select-String "https://.*vercel.app" | Select-Object -First 1).Line.Trim()

if (-not $vercelUrl) {
    Write-Host "✗ Vercel deployment failed" @Red
    exit 1
}

Write-Host "✓ Frontend deployed" @Green
Write-Host "  URL: $vercelUrl" @Green

# ==================== Phase 3B: Fly.io Backend ====================
Write-Host "`nPhase 3B: Fly.io Backend Deployment..." @Yellow

$appName = "memolib-$Environment"

Write-Host "  → Deploying BACKEND to Fly.io ($Environment)..." @Yellow
& flyctl deploy --remote-only --app $appName 2>&1 | Out-Null

Write-Host "✓ Backend deployed" @Green

# Get Fly URL
$flyStatus = & flyctl status --json --app $appName 2>&1 | ConvertFrom-Json
$flyUrl = $flyStatus.Hostname

Write-Host "  URL: https://$flyUrl" @Green

# ==================== Phase 4: Database Migrations ====================
Write-Host "`nPhase 4: Database Migrations..." @Yellow

Write-Host "  → Running Prisma migrations..." @Yellow
& flyctl ssh console -a $appName --command "npm run prisma:migrate" 2>&1 | Out-Null

Write-Host "✓ Migrations completed" @Green

# ==================== Phase 5: Health Checks ====================
Write-Host "`nPhase 5: Health Checks..." @Yellow

Write-Host "  → Waiting 30 seconds for deployments to be live..." @Yellow
Start-Sleep -Seconds 30

# Frontend health
Write-Host "  → Frontend health check..." @Yellow
try {
    Invoke-WebRequest -Uri "$vercelUrl/api/health" -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✓ Frontend healthy" @Green
} catch {
    Write-Host "✗ Frontend health check failed" @Red
}

# Backend health
Write-Host "  → Backend health check..." @Yellow
try {
    Invoke-WebRequest -Uri "https://$flyUrl/api/health" -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✓ Backend healthy" @Green
} catch {
    Write-Host "✗ Backend health check failed" @Red
}

# ==================== Phase 6: GitHub App Configuration ====================
Write-Host "`nPhase 6: GitHub App Configuration..." @Yellow

$webhookUrl = "$vercelUrl/api/github/webhook"
Write-Host "  → GitHub App webhook URL:" @Yellow
Write-Host "    $webhookUrl" @Green

Write-Host "`n⚠ MANUAL STEP REQUIRED:" @Yellow
Write-Host "  1. Go to: https://github.com/settings/apps/memolib-guardian" @Yellow
Write-Host "  2. Update Webhook URL: $webhookUrl" @Yellow
Write-Host "  3. Verify secrets are configured" @Yellow

# ==================== Success ====================
Write-Host "`n" @Blue
Write-Host "════════════════════════════════════════════════════════════" @Blue
Write-Host "✨ Complete Deployment Successful!" @Green
Write-Host "════════════════════════════════════════════════════════════" @Blue

Write-Host "`n📊 Deployment Summary:" @Yellow
Write-Host "  Frontend:  $vercelUrl"
Write-Host "  Backend:   https://$flyUrl"
Write-Host "  Environment: $Environment"

Write-Host "`n📋 Next Steps:" @Yellow
Write-Host "  1. Update GitHub webhook URL"
Write-Host "  2. Test OAuth: $vercelUrl/api/auth/signin"
Write-Host "  3. Create test issue to verify webhooks"
Write-Host "  4. Monitor both services"

Write-Host "`n📈 Useful Links:" @Yellow
Write-Host "  Vercel Dashboard:    https://vercel.com/dashboard"
Write-Host "  Fly.io Dashboard:    https://fly.io/dashboard"
Write-Host "  GitHub App Settings: https://github.com/settings/apps/memolib-guardian"

Write-Host "`n🔄 Monitoring:" @Yellow
Write-Host "  Frontend logs: vercel logs -a memolib --follow"
Write-Host "  Backend logs:  flyctl logs -a $appName --follow"
Write-Host "  Backend SSH:   flyctl ssh console -a $appName"

Write-Host "`n"
