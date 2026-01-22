# Démarrer Backend Python FastAPI
# Version: 1.0
# Date: 19 janvier 2026

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 DÉMARRAGE BACKEND PYTHON - IA POSTE MANAGER           ║
║                                                              ║
║   FastAPI + Uvicorn + Ollama                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Vérifier environnement Conda
Write-Host "`n[1/4] 🔍 Vérification environnement Conda..." -ForegroundColor Yellow
try {
    $envExists = conda env list | Select-String "iapostemanager"
    if (-not $envExists) {
        Write-Host "  ❌ Environnement 'iapostemanager' non trouvé!" -ForegroundColor Red
        Write-Host "  💡 Exécutez d'abord: .\setup-conda.ps1" -ForegroundColor Yellow
        pause
        exit 1
    }
    Write-Host "  ✅ Environnement trouvé" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Conda non installé!" -ForegroundColor Red
    Write-Host "  💡 Installez Conda puis exécutez: .\setup-conda.ps1" -ForegroundColor Yellow
    pause
    exit 1
}

# Activer environnement
Write-Host "`n[2/4] 🐍 Activation environnement..." -ForegroundColor Yellow
conda activate iapostemanager
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Erreur activation environnement" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  ✅ Environnement activé" -ForegroundColor Green

# Vérifier Ollama (optionnel)
Write-Host "`n[3/4] 🤖 Vérification Ollama..." -ForegroundColor Yellow
try {
    $ollamaStatus = Invoke-RestMethod -Uri "http://localhost:11434" -ErrorAction SilentlyContinue
    Write-Host "  ✅ Ollama actif sur http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Ollama non accessible (optionnel)" -ForegroundColor Yellow
    Write-Host "  💡 Pour activer IA locale: ollama serve" -ForegroundColor Cyan
}

# Choisir backend à lancer
Write-Host "`n[4/4] 🎯 Sélection backend:" -ForegroundColor Yellow
Write-Host "  1️⃣  FastAPI Principal (src/backend/main.py) - Recommandé" -ForegroundColor Cyan
Write-Host "  2️⃣  Flask Simple (backend-python/app.py)" -ForegroundColor Cyan
Write-Host "  3️⃣  FastAPI Simple (src/backend/main_simple.py)" -ForegroundColor Cyan
Write-Host "  4️⃣  Production (Gunicorn + Uvicorn workers)" -ForegroundColor Cyan

$choice = Read-Host "`n  Votre choix (1-4, défaut: 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

Write-Host ""

switch ($choice) {
    "1" {
        # FastAPI Principal
        Write-Host "🔥 Lancement FastAPI Principal..." -ForegroundColor Green
        Write-Host ""
        Write-Host "  📡 API: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  📚 Docs: http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host "  🔄 Mode reload activé" -ForegroundColor Yellow
        Write-Host "  ⚡ Modifications auto-rechargées" -ForegroundColor Yellow
        Write-Host ""
        
        Set-Location -Path "src\backend"
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info
    }
    "2" {
        # Flask Simple
        Write-Host "🔥 Lancement Flask Simple..." -ForegroundColor Green
        Write-Host ""
        Write-Host "  📡 API: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "  🔄 Mode debug activé" -ForegroundColor Yellow
        Write-Host ""
        
        Set-Location -Path "backend-python"
        $env:FLASK_APP = "app.py"
        $env:FLASK_ENV = "development"
        python app.py
    }
    "3" {
        # FastAPI Simple
        Write-Host "🔥 Lancement FastAPI Simple..." -ForegroundColor Green
        Write-Host ""
        Write-Host "  📡 API: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  📚 Docs: http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host ""
        
        Set-Location -Path "src\backend"
        uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000
    }
    "4" {
        # Production avec Gunicorn
        Write-Host "🔥 Lancement Production (Gunicorn)..." -ForegroundColor Green
        Write-Host ""
        Write-Host "  📡 API: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  👷 Workers: 4" -ForegroundColor Yellow
        Write-Host "  ⚙️  Worker class: Uvicorn" -ForegroundColor Yellow
        Write-Host ""
        
        Set-Location -Path "src\backend"
        gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --log-level info
    }
    default {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
        pause
        exit 1
    }
}
