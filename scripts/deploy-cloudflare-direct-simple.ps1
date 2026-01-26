# CLOUDFLARE PAGES DIRECT UPLOAD - Simple Version
Write-Host "`n========== CLOUDFLARE PAGES DEPLOYMENT ==========" -ForegroundColor Cyan

# STEP 1: Check authentication
Write-Host "`n[1/5] Checking Cloudflare authentication..." -ForegroundColor Yellow
$env:DOTENV_KEY = ""
$account = & npx wrangler whoami 2>&1 | Select-String "associated with"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated with Cloudflare" -ForegroundColor Red
    Write-Host "Run: npx wrangler login" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: $account" -ForegroundColor Green

# STEP 2: Check project exists
Write-Host "`n[2/5] Checking Cloudflare Pages project..." -ForegroundColor Yellow
$projects = & npx wrangler pages project list 2>&1
if ($projects -match "iapostemanage") {
    Write-Host "OK: Project 'iapostemanage' found" -ForegroundColor Green
} else {
    Write-Host "ERROR: Project 'iapostemanage' not found" -ForegroundColor Red
    Write-Host "Create it: npx wrangler pages project create" -ForegroundColor Yellow
    exit 1
}

# STEP 3: Get current branch
Write-Host "`n[3/5] Detecting Git branch..." -ForegroundColor Yellow
$branch = & git branch --show-current 2>&1
Write-Host "Current branch: $branch" -ForegroundColor Green

# STEP 4: Build Next.js
Write-Host "`n[4/5] Building Next.js..." -ForegroundColor Yellow
Write-Host "Command: npm run build" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful" -ForegroundColor Green

# STEP 5: Deploy
Write-Host "`n[5/5] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
$env:DOTENV_KEY = ""

if ($branch -eq "main") {
    Write-Host "Environment: PRODUCTION" -ForegroundColor Cyan
    $cmd = "npx wrangler pages deploy .next/standalone"
} elseif ($branch -eq "staging") {
    Write-Host "Environment: STAGING" -ForegroundColor Cyan
    $cmd = "npx wrangler pages deploy .next/standalone --branch=staging"
} else {
    Write-Host "Environment: PREVIEW ($branch)" -ForegroundColor Cyan
    $cmd = "npx wrangler pages deploy .next/standalone --branch=$branch"
}

Write-Host "Command: $cmd`n" -ForegroundColor Gray
Invoke-Expression $cmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Deployment failed!" -ForegroundColor Red
    exit 1
}

# STEP 6: Summary
Write-Host "`n========== DEPLOYMENT COMPLETE ==========" -ForegroundColor Green
Write-Host "`nDeployment URLs:" -ForegroundColor Cyan
Write-Host "  Production: https://iapostemanage.pages.dev" -ForegroundColor White
Write-Host "  Staging:    https://staging.iapostemanage.pages.dev" -ForegroundColor White
Write-Host "  Preview:    https://$branch.iapostemanage.pages.dev" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  List projects:    npx wrangler pages project list" -ForegroundColor Gray
Write-Host "  List deployments: npx wrangler pages deployment list" -ForegroundColor Gray
Write-Host "  View logs:        npx wrangler pages deployment tail" -ForegroundColor Gray
Write-Host "  Dashboard:        https://dash.cloudflare.com/?to=/:account/pages" -ForegroundColor Gray

Write-Host "`nNext: Configure environment variables in Cloudflare Dashboard" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
