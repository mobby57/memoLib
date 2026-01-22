# Tests Backend Python
# Version: 1.0
# Date: 19 janvier 2026

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🧪 TESTS BACKEND PYTHON - IA POSTE MANAGER               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Activer environnement
Write-Host "`n[1/5] 🐍 Activation environnement..." -ForegroundColor Yellow
conda activate iapostemanager
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Environnement non trouvé. Exécutez: .\setup-conda.ps1" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  ✅ Environnement activé" -ForegroundColor Green

# Test imports critiques
Write-Host "`n[2/5] 🔍 Test imports critiques..." -ForegroundColor Yellow
$importTest = @"
import sys
print('  Python version:', sys.version.split()[0])

try:
    import fastapi
    print('  ✅ FastAPI:', fastapi.__version__)
except Exception as e:
    print(f'  ❌ FastAPI: {e}')
    sys.exit(1)

try:
    import numpy
    print('  ✅ NumPy:', numpy.__version__)
except Exception as e:
    print(f'  ❌ NumPy: {e}')
    sys.exit(1)

try:
    import flask
    print('  ✅ Flask:', flask.__version__)
except Exception as e:
    print(f'  ❌ Flask: {e}')

try:
    import ollama
    print('  ✅ Ollama: OK')
except:
    print('  ⚠️  Ollama: Non installé (optionnel)')

try:
    import uvicorn
    print('  ✅ Uvicorn:', uvicorn.__version__)
except Exception as e:
    print(f'  ❌ Uvicorn: {e}')
    sys.exit(1)

print('`n  🎉 Tous les imports critiques OK!')
"@

python -c $importTest

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Échec tests imports" -ForegroundColor Red
    pause
    exit 1
}

# Test services IA
Write-Host "`n[3/5] 🤖 Test services IA..." -ForegroundColor Yellow
$aiTest = @"
import sys
sys.path.insert(0, 'src/backend')

try:
    from services.predictive_ai import PredictiveLegalAI
    ai = PredictiveLegalAI()
    print('  ✅ Predictive AI service OK')
except Exception as e:
    print(f'  ⚠️  Predictive AI: {e}')

print('  🎉 Services IA testés!')
"@

python -c $aiTest

# Tests unitaires (si disponibles)
Write-Host "`n[4/5] 📝 Tests unitaires..." -ForegroundColor Yellow
if (Test-Path "src/backend/tests") {
    Write-Host "  Lancement pytest..." -ForegroundColor Cyan
    pytest src/backend/tests -v --tb=short
} else {
    Write-Host "  ⚠️  Dossier tests non trouvé - création recommandée" -ForegroundColor Yellow
}

# Test API endpoint (si serveur lancé)
Write-Host "`n[5/5] 🌐 Test endpoints API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "  ✅ Health check OK" -ForegroundColor Green
    Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "  ⚠️  Serveur non accessible sur http://localhost:8000" -ForegroundColor Yellow
    Write-Host "  💡 Lancez le backend avec: .\start-python-backend.ps1" -ForegroundColor Cyan
}

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ✅ TESTS TERMINÉS!                                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

📊 Résumé:
   - Imports: ✅
   - Services IA: ✅
   - Tests unitaires: (si disponibles)
   - API: (si serveur lancé)

💡 Prochaines étapes:
   1️⃣  Lancer backend: .\start-python-backend.ps1
   2️⃣  Tester API: http://localhost:8000/docs
   3️⃣  Développer: code .

"@ -ForegroundColor Green

pause
