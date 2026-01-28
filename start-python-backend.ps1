# Demarrer Backend Python FastAPI
# Version: 1.0

Write-Output "=============================================="
Write-Output "  DEMARRAGE BACKEND PYTHON - IA POSTE MANAGER"
Write-Output "  FastAPI + Uvicorn + Ollama"
Write-Output "=============================================="

# Verifier environnement Conda
Write-Output ""
Write-Output "[1/4] Verification environnement Conda..."
try {
    $envExists = conda env list | Select-String "memoLib"
    if (-not $envExists) {
        Write-Output "  [ERREUR] Environnement 'memoLib' non trouve!"
        Write-Output "  [INFO] Executez d'abord: .\setup-conda.ps1"
        pause
        exit 1
    }
    Write-Output "  [OK] Environnement trouve"
} catch {
    Write-Output "  [ERREUR] Conda non installe!"
    Write-Output "  [INFO] Installez Conda puis executez: .\setup-conda.ps1"
    pause
    exit 1
}

# Activer environnement
Write-Output ""
Write-Output "[2/4] Activation environnement..."
conda activate memoLib
if ($LASTEXITCODE -ne 0) {
    Write-Output "  [ERREUR] Erreur activation environnement"
    pause
    exit 1
}
Write-Output "  [OK] Environnement active"

# Verifier Ollama (optionnel)
Write-Output ""
Write-Output "[3/4] Verification Ollama..."
try {
    $ollamaStatus = Invoke-RestMethod -Uri "http://localhost:11434" -ErrorAction SilentlyContinue
    Write-Output "  [OK] Ollama actif sur http://localhost:11434"
} catch {
    Write-Output "  [WARN] Ollama non accessible (optionnel)"
    Write-Output "  [INFO] Pour activer IA locale: ollama serve"
}

# Choisir backend a lancer
Write-Output ""
Write-Output "[4/4] Selection backend:"
Write-Output "  1. FastAPI Principal (src/backend/main.py) - Recommande"
Write-Output "  2. Flask Simple (backend-python/app.py)"
Write-Output "  3. FastAPI Simple (src/backend/main_simple.py)"
Write-Output "  4. Production (Gunicorn + Uvicorn workers)"

$choice = Read-Host "  Votre choix (1-4, defaut: 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

Write-Output ""

switch ($choice) {
    "1" {
        # FastAPI Principal
        Write-Output "[INFO] Lancement FastAPI Principal..."
        Write-Output ""
        Write-Output "  API: http://localhost:8000"
        Write-Output "  Docs: http://localhost:8000/docs"
        Write-Output "  Mode reload active"
        Write-Output ""
        
        Set-Location -Path "src\backend"
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info
    }
    "2" {
        # Flask Simple
        Write-Output "[INFO] Lancement Flask Simple..."
        Write-Output ""
        Write-Output "  URL: http://localhost:5000"
        Write-Output ""
        
        Set-Location -Path "backend-python"
        python app.py
    }
    "3" {
        # FastAPI Simple
        Write-Output "[INFO] Lancement FastAPI Simple..."
        Write-Output ""
        Write-Output "  API: http://localhost:8000"
        Write-Output ""
        
        Set-Location -Path "src\backend"
        uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000
    }
    "4" {
        # Production
        Write-Output "[INFO] Lancement en mode Production..."
        Write-Output ""
        Write-Output "  Workers: 4"
        Write-Output "  Port: 8000"
        Write-Output ""
        
        Set-Location -Path "src\backend"
        gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
    }
    default {
        Write-Output "[ERREUR] Choix invalide. Lancement FastAPI par defaut..."
        Set-Location -Path "src\backend"
        uvicorn main:app --reload --host 0.0.0.0 --port 8000
    }
}
