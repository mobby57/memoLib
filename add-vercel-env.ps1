# Quick script to add environment variables to Vercel

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ADDING VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Step 1: NEXTAUTH_SECRET" -ForegroundColor Yellow
Write-Host "Value: Q97Ygwujvkq5DO4xFbTJsCaU6WScoArP`n" -ForegroundColor Gray

$env1 = Read-Host "Press Enter to add NEXTAUTH_SECRET or type 'skip' to skip"
if ($env1 -ne 'skip') {
    Write-Host "Q97Ygwujvkq5DO4xFbTJsCaU6WScoArP" | vercel env add NEXTAUTH_SECRET production
}

Write-Host "`nStep 2: NEXTAUTH_URL" -ForegroundColor Yellow
Write-Host "Value: https://memoLib-mobby57s-projects.vercel.app`n" -ForegroundColor Gray

$env2 = Read-Host "Press Enter to add NEXTAUTH_URL or type 'skip' to skip"
if ($env2 -ne 'skip') {
    Write-Host "https://memoLib-mobby57s-projects.vercel.app" | vercel env add NEXTAUTH_URL production
}

Write-Host "`nStep 3: DATABASE_URL" -ForegroundColor Yellow
Write-Host "WARNING: SQLite won't work on Vercel!" -ForegroundColor Red
Write-Host "`nOptions:" -ForegroundColor Cyan
Write-Host "1. Vercel Postgres (run: vercel integration add postgres)" -ForegroundColor White
Write-Host "2. Neon.tech (free, get from https://neon.tech)" -ForegroundColor White
Write-Host "3. Skip for now (you'll need to add it manually)`n" -ForegroundColor White

$dbChoice = Read-Host "Choose (1-3)"

if ($dbChoice -eq "1") {
    Write-Host "`nRun this command to add Vercel Postgres:" -ForegroundColor Yellow
    Write-Host "vercel integration add postgres`n" -ForegroundColor White
} elseif ($dbChoice -eq "2") {
    Write-Host "`nPaste your Neon connection string:" -ForegroundColor Yellow
    $neonUrl = Read-Host "Connection string"
    if ($neonUrl) {
        Write-Host $neonUrl | vercel env add DATABASE_URL production
    }
} else {
    Write-Host "`nSkipping DATABASE_URL - remember to add it!" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DONE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify: vercel env ls" -ForegroundColor White
Write-Host "2. Redeploy: vercel --prod --force`n" -ForegroundColor White
