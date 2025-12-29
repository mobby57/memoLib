# Script de tests PowerShell

Write-Host "🧪 Exécution des tests IAPosteManager" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Backend tests
Write-Host "[1/2] Tests Backend..." -ForegroundColor Yellow
pytest tests/ -v --cov=src/backend --cov-report=term --cov-report=html

# Frontend tests
Write-Host ""
Write-Host "[2/2] Tests Frontend..." -ForegroundColor Yellow
cd src/frontend
npm run test

Write-Host ""
Write-Host "✅ Tests terminés !" -ForegroundColor Green
Write-Host "📊 Coverage: htmlcov/index.html" -ForegroundColor Cyan

