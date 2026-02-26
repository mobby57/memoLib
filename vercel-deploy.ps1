# MemoLib Vercel Deployment Script (PowerShell for Windows)
# Usage: .\vercel-deploy.ps1 -Environment staging|production

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
Write-Host "========================================" @Blue
Write-Host "🚀 MemoLib Vercel Deployment" @Blue
Write-Host "Environment: $Environment" @Blue
Write-Host "========================================" @Blue

# ==================== Phase 1: Pre-checks ====================
Write-Host "`nPhase 1: Pre-deployment checks..." @Yellow

try {
    vercel --version | Out-Null
    Write-Host "✓ Vercel CLI found" @Green
} catch {
    Write-Host "✗ Vercel CLI not found" @Red
    Write-Host "  Install: npm install -g vercel" @Red
    exit 1
}

try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠ Uncommitted changes found, stashing..." @Yellow
        git stash | Out-Null
    }
    Write-Host "✓ Git status clean" @Green
} catch {
    Write-Host "✗ Git error: $_" @Red
    exit 1
}

# ==================== Phase 2: Build verification ====================
Write-Host "`nPhase 2: Build verification..." @Yellow

Write-Host "  → Running type-check..." @Yellow
npm run type-check 2>&1 | Out-Null
Write-Host "✓ Type check completed" @Green

# ==================== Phase 3: Vercel Deployment ====================
Write-Host "`nPhase 3: Vercel Deployment ($Environment)..." @Yellow

if ($Environment -eq "production") {
    Write-Host "  → Deploying to PRODUCTION..." @Yellow
    $deploymentOutput = & vercel deploy --prod 2>&1
    $deploymentUrl = ($deploymentOutput | Select-String "https://.*vercel.app" | Select-Object -First 1).Line.Trim()
} else {
    Write-Host "  → Deploying to STAGING (Preview)..." @Yellow
    $deploymentOutput = & vercel deploy 2>&1
    $deploymentUrl = ($deploymentOutput | Select-String "https://.*vercel.app" | Select-Object -First 1).Line.Trim()
}

if (-not $deploymentUrl) {
    Write-Host "✗ Deployment failed" @Red
    Write-Host "Output: $deploymentOutput" @Red
    exit 1
}

Write-Host "✓ Deployment completed" @Green
Write-Host "  URL: $deploymentUrl" @Green

# ==================== Phase 4: Post-deployment tests ====================
Write-Host "`nPhase 4: Post-deployment tests..." @Yellow

Write-Host "  → Waiting 30 seconds for deployment to be live..." @Yellow
Start-Sleep -Seconds 30

Write-Host "  → Health check..." @Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$deploymentUrl/api/health" -ErrorAction SilentlyContinue
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✓ Health check passed" @Green
    } else {
        Write-Host "✗ Health check failed (Status: $($healthResponse.StatusCode))" @Red
        Write-Host "  Check logs: vercel logs -a memolib" @Red
    }
} catch {
    Write-Host "✗ Health check failed: $_" @Red
    Write-Host "  Check logs: vercel logs -a memolib" @Red
}

# ==================== Phase 5: GitHub App Configuration ====================
Write-Host "`nPhase 5: GitHub App Configuration..." @Yellow

$webhookUrl = "$deploymentUrl/api/github/webhook"
Write-Host "  → GitHub App webhook URL should be:" @Yellow
Write-Host "    $webhookUrl" @Green

Write-Host "`n⚠ MANUAL STEP REQUIRED:" @Yellow
Write-Host "  Go to: https://github.com/settings/apps/memolib-guardian" @Yellow
Write-Host "  Update Webhook URL if this is a new deployment" @Yellow

# ==================== Success ====================
Write-Host "`n" @Blue
Write-Host "========================================" @Blue
Write-Host "✨ Deployment successful!" @Green
Write-Host "========================================" @Blue

Write-Host "`n📊 Next steps:" @Yellow
Write-Host "  1. Update GitHub webhook URL (if needed)"
Write-Host "  2. Test OAuth: $deploymentUrl/api/auth/signin"
Write-Host "  3. Create test issue to verify webhooks"
Write-Host "  4. Monitor logs: vercel logs -a memolib --follow"

Write-Host "`n📈 Useful links:" @Yellow
Write-Host "  Frontend: $deploymentUrl"
Write-Host "  Dashboard: https://vercel.com/dashboard"
Write-Host "  GitHub App: https://github.com/settings/apps/memolib-guardian"

Write-Host "`n"
