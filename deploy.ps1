# MemoLib - Deploiement Production
Write-Host "MemoLib - Deploiement Production" -ForegroundColor Cyan

Set-Location src\frontend

Write-Host "1. Verifications..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) { exit 1 }

npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit 1 }

npx playwright test --workers=100%
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Tests OK" -ForegroundColor Green

Write-Host "2. Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Build OK" -ForegroundColor Green

Write-Host "3. Deploiement Vercel..." -ForegroundColor Yellow
vercel --prod
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Deploy OK" -ForegroundColor Green

Write-Host "4. Migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "5. Health Check..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
try {
    $response = Invoke-WebRequest -Uri "https://memolib.fr/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "Health check OK" -ForegroundColor Green
    }
} catch {
    Write-Host "Health check failed" -ForegroundColor Red
}

Write-Host "Deploiement termine!" -ForegroundColor Green
Write-Host "URL: https://memolib.fr" -ForegroundColor Cyan
