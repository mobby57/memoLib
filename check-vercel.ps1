# Vercel Deployment Verification Script
# Checks if your deployment has all required environment variables

Write-Host "`n========================================"
Write-Host "  VERCEL DEPLOYMENT CHECKER"
Write-Host "========================================`n"

# Required environment variables
$requiredVars = @("NEXTAUTH_SECRET", "NEXTAUTH_URL", "DATABASE_URL")

Write-Host "Checking Vercel environment variables...`n"

# Get environment variables from Vercel
$envOutput = vercel env ls 2>&1 | Out-String

# Check each required variable
$missingVars = @()
$foundVars = @()

foreach ($var in $requiredVars) {
    if ($envOutput -match $var) {
        $foundVars += $var
        Write-Host "[OK] $var" -ForegroundColor Green
    } else {
        $missingVars += $var
        Write-Host "[MISSING] $var" -ForegroundColor Red
    }
}

Write-Host "`n========================================"
Write-Host "  RESULTS"
Write-Host "========================================`n"

if ($missingVars.Count -eq 0) {
    Write-Host "All required environment variables are set!" -ForegroundColor Green
    Write-Host "`nNext steps:"
    Write-Host "1. Verify DATABASE_URL is PostgreSQL (not SQLite)"
    Write-Host "2. Redeploy: vercel --prod --force"
} else {
    Write-Host "Missing required variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var"
    }
    Write-Host "`nTo fix: .\fix-vercel-env.ps1`n"
}

Write-Host "`nProduction URL:"
Write-Host "https://memoLib-mobby57s-projects.vercel.app`n"
