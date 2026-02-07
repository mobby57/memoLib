# 🚀 Script de Déploiement Production MemoLib (Windows)
# Usage: .\deploy-production.ps1

Write-Host "🚀 MemoLib - Déploiement Production" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Vérifications
Write-Host "`n📋 1. Vérifications..." -ForegroundColor Yellow

Set-Location src\frontend

Write-Host "  -> Linting..."
npm run lint
if ($LASTEXITCODE -ne 0) { Write-Host "X Lint failed" -ForegroundColor Red; exit 1 }

Write-Host "  -> Type checking..."
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Write-Host "X Type check failed" -ForegroundColor Red; exit 1 }

Write-Host "  -> Tests E2E..."
npx playwright test --workers=100%
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Tests failed" -ForegroundColor Red; exit 1 }

Write-Host "✅ Tous les tests passent" -ForegroundColor Green

# 2. Build
Write-Host "`n🔨 2. Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Build failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Build réussi" -ForegroundColor Green

# 3. Déploiement
Write-Host "`n🚀 3. Déploiement Vercel..." -ForegroundColor Yellow
vercel --prod
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Deploy failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Déployé sur Vercel" -ForegroundColor Green

# 4. Migrations
Write-Host "`n🗄️  4. Migrations Database..." -ForegroundColor Yellow
npx prisma migrate deploy
Write-Host "✅ Migrations appliquées" -ForegroundColor Green

# 5. Health Check
Write-Host "`n🏥 5. Health Check..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
try {
    $response = Invoke-WebRequest -Uri "https://memolib.fr/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Déploiement réussi !" -ForegroundColor Green
Write-Host "🌐 URL: https://memolib.fr" -ForegroundColor Cyan
Write-Host "📊 Dashboard: https://vercel.com" -ForegroundColor Cyan
