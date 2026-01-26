# Tests Backend Python
# Version: 1.0

Write-Output "=============================================="
Write-Output "  TESTS BACKEND PYTHON - IA POSTE MANAGER"
Write-Output "=============================================="

# Activer environnement
Write-Output ""
Write-Output "[1/5] Activation environnement..."
conda activate iapostemanager
if ($LASTEXITCODE -ne 0) {
    Write-Output "  [ERREUR] Environnement non trouve. Executez: .\setup-conda.ps1"
    pause
    exit 1
}
Write-Output "  [OK] Environnement active"

# Test imports critiques
Write-Output ""
Write-Output "[2/5] Test imports critiques..."
$importTest = @"
import sys
print('  Python version:', sys.version.split()[0])

try:
    import fastapi
    print('  [OK] FastAPI:', fastapi.__version__)
except Exception as e:
    print(f'  [ERREUR] FastAPI: {e}')
    sys.exit(1)

try:
    import numpy
    print('  [OK] NumPy:', numpy.__version__)
except Exception as e:
    print(f'  [ERREUR] NumPy: {e}')
    sys.exit(1)

try:
    import flask
    print('  [OK] Flask:', flask.__version__)
except Exception as e:
    print(f'  [ERREUR] Flask: {e}')

try:
    import ollama
    print('  [OK] Ollama: OK')
except:
    print('  [WARN] Ollama: Non installe (optionnel)')

try:
    import uvicorn
    print('  [OK] Uvicorn:', uvicorn.__version__)
except Exception as e:
    print(f'  [ERREUR] Uvicorn: {e}')
    sys.exit(1)

print('')
print('  Tous les imports critiques OK!')
"@

python -c $importTest

if ($LASTEXITCODE -ne 0) {
    Write-Output ""
    Write-Output "[ERREUR] Echec tests imports"
    pause
    exit 1
}

# Test services IA
Write-Output ""
Write-Output "[3/5] Test services IA..."
$aiTest = @"
import sys
sys.path.insert(0, 'src/backend')

try:
    from services.predictive_ai import PredictiveLegalAI
    ai = PredictiveLegalAI()
    print('  [OK] Predictive AI service OK')
except Exception as e:
    print(f'  [WARN] Predictive AI: {e}')

print('  Services IA testes!')
"@

python -c $aiTest

# Tests unitaires (si disponibles)
Write-Output ""
Write-Output "[4/5] Tests unitaires..."
if (Test-Path "src/backend/tests") {
    Write-Output "  Lancement pytest..."
    pytest src/backend/tests -v --tb=short
} else {
    Write-Output "  [WARN] Dossier tests non trouve - creation recommandee"
}

# Test API endpoint (si serveur lance)
Write-Output ""
Write-Output "[5/5] Test endpoints API..."

$apiTest = @"
import requests
import sys

try:
    response = requests.get('http://localhost:8000/health', timeout=5)
    if response.status_code == 200:
        print('  [OK] API Backend accessible')
        print(f'  Response: {response.json()}')
    else:
        print(f'  [WARN] API returned status {response.status_code}')
except requests.exceptions.ConnectionError:
    print('  [INFO] Serveur backend non demarre (normal si pas lance)')
except Exception as e:
    print(f'  [WARN] Test API: {e}')
"@

python -c $apiTest

Write-Output ""
Write-Output "=============================================="
Write-Output "  TESTS TERMINES"
Write-Output "=============================================="
Write-Output ""
Write-Output "Pour demarrer le backend: .\start-python-backend.ps1"
