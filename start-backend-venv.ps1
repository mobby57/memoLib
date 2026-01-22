# Demarrage Backend Python - Version venv
# Utilise l'environnement virtuel Python au lieu de Conda

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "   BACKEND PYTHON - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Verifier environnement virtuel
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "[ERREUR] Environnement virtuel non trouve!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creez-le avec:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor White
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "  pip install -r requirements-python.txt" -ForegroundColor White
    exit 1
}

# Activer environnement
Write-Host "[1/3] Activation environnement Python..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1
Write-Host "  [OK] Environnement actif" -ForegroundColor Green

# Verifier Ollama (optionnel)
Write-Host ""
Write-Host "[2/3] Verification Ollama (optionnel)..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "  [OK] Ollama detecte et actif" -ForegroundColor Green
} catch {
    Write-Host "  [INFO] Ollama non detecte (optionnel)" -ForegroundColor Gray
    Write-Host "  Pour installer: https://ollama.ai/" -ForegroundColor Gray
}

# Selectionner mode de lancement
Write-Host ""
Write-Host "[3/3] Selection mode backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Modes disponibles:" -ForegroundColor Cyan
Write-Host "  1. FastAPI Principal (recommande) - src/backend/main.py" -ForegroundColor White
Write-Host "  2. Flask Simple - backend-python/app.py" -ForegroundColor White
Write-Host "  3. Mode Production (Gunicorn)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1-3)"

Write-Host ""
Write-Host "Lancement du backend..." -ForegroundColor Green
Write-Host "API Docs disponible sur: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter" -ForegroundColor Gray
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "Mode: FastAPI Principal" -ForegroundColor Yellow
        Write-Host ""
        python -m uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000
    }
    "2" {
        Write-Host "Mode: Flask Simple" -ForegroundColor Yellow
        Write-Host ""
        $env:FLASK_APP = "backend-python/app.py"
        $env:FLASK_ENV = "development"
        python -m flask run --host 0.0.0.0 --port 8000
    }
    "3" {
        Write-Host "Mode: Production Gunicorn" -ForegroundColor Yellow
        Write-Host ""
        python -m gunicorn src.backend.main:app --workers 4 --bind 0.0.0.0:8000 --worker-class uvicorn.workers.UvicornWorker
    }
    default {
        Write-Host "Choix invalide. Utilisation mode FastAPI par defaut..." -ForegroundColor Yellow
        Write-Host ""
        python -m uvicorn src.backend.main:app --reload --host 0.0.0.0 --port 8000
    }
}
