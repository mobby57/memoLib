# start-pipeline.ps1
# Démarrage complet du pipeline d'analyse MemoLib pour Windows
# Version: 2.0 - Améliorations pour stabilité

param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [int]$Port = 5000
)

Write-Host ""
Write-Host "🚀 =========================================" -ForegroundColor Green
Write-Host "   MEMOLIB - Démarrage du Pipeline" -ForegroundColor Green
Write-Host "   Pipeline d'Analyse Juridique" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check environment
Write-Host "📋 Vérification de l'environnement..." -ForegroundColor Cyan

# Python check
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Python non trouvé" -ForegroundColor Red
    exit 1
}

# Node check
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js non trouvé" -ForegroundColor Red
    exit 1
}

# Check pipeline module
try {
    python -c "from analysis.pipelines.pipeline import AnalysisPipeline" 2>&1 | Out-Null
    Write-Host "  ✅ Pipeline Python importable" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Module Pipeline non disponible (installation requise)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Cyan

# Check Python deps
$pythonDeps = @("flask", "pandas", "flask_cors", "apscheduler")
foreach ($dep in $pythonDeps) {
    try {
        python -c "import $dep" 2>&1 | Out-Null
        Write-Host "  ✅ $dep" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $dep manquant - Installation en cours..." -ForegroundColor Yellow
        pip install -q $dep | Out-Null
    }
}

Write-Host ""
Write-Host "🎯 Démarrage des services..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
if (-not $SkipBackend) {
    Write-Host "  → Démarrage Flask Backend (port $Port)..." -ForegroundColor Yellow

    $backendCmd = @"
`$env:PYTHONPATH = '.';
`$env:FLASK_APP = 'backend-python/app.py';
Write-Host 'Flask démarrant sur http://127.0.0.1:$Port' -ForegroundColor Green;
python -m flask run --port $Port --no-reload
"@

    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru -WindowStyle Normal
    Write-Host "    PID: $($backendProcess.Id)" -ForegroundColor Gray
    Write-Host "    ✓ Backend lancé" -ForegroundColor Green
}

# Start Frontend
if (-not $SkipFrontend) {
    Write-Host ""
    Write-Host "  → Démarrage Next.js Frontend (port 3000/3001)..." -ForegroundColor Yellow

    $frontendCmd = @"
cd 'src\frontend';
Write-Host 'Next.js démarrant sur http://127.0.0.1:3000' -ForegroundColor Green;
npm run dev
"@

    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -PassThru -WindowStyle Normal
    Write-Host "    PID: $($frontendProcess.Id)" -ForegroundColor Gray
    Write-Host "    ✓ Frontend lancé" -ForegroundColor Green
}

Write-Host ""
Write-Host "⏳ Attente du démarrage des services (8 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Services Démarrés!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Endpoints Disponibles:" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:" -ForegroundColor White
Write-Host "    http://localhost:3000" -ForegroundColor Cyan
Write-Host "    http://localhost:3001 (si port 3000 occupé)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Backend:" -ForegroundColor White
Write-Host "    http://localhost:$Port/analysis/health" -ForegroundColor Cyan
Write-Host "    http://localhost:$Port/analysis/execute" -ForegroundColor Cyan
Write-Host "    http://localhost:$Port/analysis/test-rules" -ForegroundColor Cyan
Write-Host "    http://localhost:$Port/analysis/stats" -ForegroundColor Cyan
Write-Host ""

Write-Host "🧪 Tests Disponibles:" -ForegroundColor Green
Write-Host ""
Write-Host "  Health Check:" -ForegroundColor White
Write-Host "    `$response = Invoke-WebRequest 'http://localhost:$Port/analysis/health'" -ForegroundColor Gray
Write-Host ""
Write-Host "  Load Test:" -ForegroundColor White
Write-Host "    python -m analysis.load_test" -ForegroundColor Gray
Write-Host ""
Write-Host "  Unit Tests:" -ForegroundColor White
Write-Host "    pytest analysis/tests/test_rules_engine.py -v" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Green
Write-Host "  - SERVICES_STARTUP_GUIDE.md (ce guide détaillé)" -ForegroundColor Gray
Write-Host "  - INTEGRATION_CHECKLIST.md (liste de vérification)" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  • Utilisez -SkipFrontend ou -SkipBackend pour démarrer sélectivement" -ForegroundColor Gray
Write-Host "  • Utilisez -Port 5001 pour changer le port du backend" -ForegroundColor Gray
Write-Host "  • Consultez SERVICES_STARTUP_GUIDE.md pour la résolution d'erreurs" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "System Ready for Testing!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

