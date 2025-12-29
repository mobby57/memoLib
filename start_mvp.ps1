# Script de démarrage rapide du MVP IA Poste Manager
# =================================================

Write-Host "🚀 Démarrage du MVP IA Poste Manager" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier Python
Write-Host "🔍 Vérification de Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python détecté : $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python non trouvé. Veuillez installer Python 3.11+" -ForegroundColor Red
    exit 1
}

# 2. Vérifier .env
Write-Host ""
Write-Host "🔍 Vérification de la configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier .env manquant - Création..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "⚠️  Veuillez configurer .env avant de continuer" -ForegroundColor Yellow
}

# 3. Vérifier les dépendances
Write-Host ""
Write-Host "🔍 Vérification des dépendances..." -ForegroundColor Yellow
$pipList = pip list 2>&1
if ($pipList -match "cryptography" -and $pipList -match "flask") {
    Write-Host "✅ Dépendances principales installées" -ForegroundColor Green
} else {
    Write-Host "⚠️  Installation des dépendances..." -ForegroundColor Yellow
    pip install -r requirements.txt --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dépendances installées avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
        exit 1
    }
}

# 4. Vérifier la sécurité
Write-Host ""
Write-Host "🔒 Vérification de la sécurité..." -ForegroundColor Yellow
if (Test-Path "data/audit_trail.json") {
    Write-Host "✅ Audit trail configuré" -ForegroundColor Green
} else {
    Write-Host "⚠️  Création de l'audit trail..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "data" -Force | Out-Null
    @{events = @()} | ConvertTo-Json | Out-File "data/audit_trail.json" -Encoding UTF8
}

# 5. Tests rapides (optionnel)
Write-Host ""
$runTests = Read-Host "Exécuter les tests de sécurité ? (o/N)"
if ($runTests -eq "o" -or $runTests -eq "O") {
    Write-Host ""
    Write-Host "🧪 Exécution des tests..." -ForegroundColor Yellow
    pytest tests/test_security_compliance.py -v --tb=short
    Write-Host ""
}

# 6. Démarrage de l'API
Write-Host ""
Write-Host "🚀 Démarrage de l'API MVP..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URL : http://localhost:5000" -ForegroundColor Green
Write-Host "📖 Docs : http://localhost:5000/api/v1/health" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

# Définir les variables d'environnement
$env:FLASK_APP = "src.backend.api_mvp"
$env:FLASK_ENV = "development"
$env:PORT = "5000"

# Démarrer l'API
try {
    python src/backend/api_mvp.py
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors du démarrage : $_" -ForegroundColor Red
    exit 1
}
