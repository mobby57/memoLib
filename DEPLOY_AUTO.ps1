#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script automatisé de préparation au déploiement PythonAnywhere
.DESCRIPTION
    Prépare automatiquement l'application IA Poste Manager pour le déploiement
#>

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Couleurs
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERR] $args" -ForegroundColor Red }
function Write-Info { Write-Host "-> $args" -ForegroundColor Cyan }
function Write-Step { Write-Host "`n=== $args ===" -ForegroundColor Yellow }

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║     🚀 DÉPLOIEMENT AUTO - IA POSTE MANAGER                     ║
║     Préparation pour PythonAnywhere                            ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Étape 1: Vérification environnement
Write-Step "1. Vérification Environnement"
Write-Info "Vérification Python..."
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python: $pythonVersion"
} catch {
    Write-Error "Python non trouvé"
    exit 1
}

Write-Info "Vérification pip..."
try {
    $pipVersion = pip --version
    Write-Success "pip installé"
} catch {
    Write-Error "pip non trouvé"
    exit 1
}

# Étape 2: Tests
Write-Step "2. Exécution Tests"
Write-Info "Tests de base..."
$testResult = pytest tests/test_basic.py -v --tb=line 2>&1 | Select-String -Pattern "passed|failed"
if ($testResult -match "passed") {
    Write-Success "Tests de base: OK"
} else {
    Write-Error "Tests de base: ÉCHEC"
}

# Étape 3: Vérification imports
Write-Step "3. Vérification Imports"
Write-Info "Import FastAPI..."
$importTest = python -c "from src.backend.main_fastapi import app; print('OK')" 2>&1
if ($importTest -match "OK") {
    Write-Success "FastAPI app: OK"
} else {
    Write-Error "Import FastAPI: ÉCHEC"
    Write-Host $importTest
}

Write-Info "Import ASGI-WSGI bridge..."
$bridgeTest = python -c "from asgiref.wsgi import WsgiToAsgi; print('OK')" 2>&1
if ($bridgeTest -match "OK") {
    Write-Success "Bridge ASGI-WSGI: OK"
} else {
    Write-Error "asgiref non installé"
    Write-Info "Installation asgiref..."
    pip install asgiref
}

# Étape 4: Génération requirements
Write-Step "4. Génération Requirements"
Write-Info "Création requirements-frozen.txt..."
pip freeze > requirements-frozen.txt
Write-Success "requirements-frozen.txt créé"

# Étape 5: Vérification fichiers essentiels
Write-Step "5. Vérification Fichiers"
$requiredFiles = @(
    "wsgi_pythonanywhere.py",
    "requirements.txt",
    ".env",
    "src/backend/main_fastapi.py",
    "src/backend/config_fastapi.py",
    "src/backend/database.py"
)

$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "$file"
    } else {
        Write-Error "$file MANQUANT"
        $allFilesPresent = $false
    }
}

# Étape 6: Vérification .env
Write-Step "6. Vérification Configuration"
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "JWT_SECRET_KEY=\w{32,}") {
        Write-Success "JWT_SECRET_KEY configuré"
    } else {
        Write-Error "JWT_SECRET_KEY manquant ou invalide"
        Write-Info "Génération nouvelle clé..."
        $jwtKey = python -c "import secrets; print(secrets.token_hex(32))"
        Write-Host "JWT_SECRET_KEY=$jwtKey" -ForegroundColor Yellow
    }
    
    if ($envContent -match "SECRET_KEY=\w{32,}") {
        Write-Success "SECRET_KEY configuré"
    } else {
        Write-Error "SECRET_KEY manquant ou invalide"
        Write-Info "Génération nouvelle clé..."
        $secretKey = python -c "import secrets; print(secrets.token_hex(32))"
        Write-Host "SECRET_KEY=$secretKey" -ForegroundColor Yellow
    }
} else {
    Write-Error ".env non trouvé"
    Write-Info "Copier .env.production vers .env"
}

# Étape 7: Création archive déploiement
Write-Step "7. Création Archive Déploiement"
Write-Info "Création dossier deploy..."
$deployDir = "deploy_pythonanywhere"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

Write-Info "Copie fichiers essentiels..."
$filesToDeploy = @(
    @{Source="src"; Destination="$deployDir/src"},
    @{Source="wsgi_pythonanywhere.py"; Destination="$deployDir/wsgi_pythonanywhere.py"},
    @{Source="requirements.txt"; Destination="$deployDir/requirements.txt"},
    @{Source=".env"; Destination="$deployDir/.env"},
    @{Source="schema.prisma"; Destination="$deployDir/schema.prisma"},
    @{Source="alembic.ini"; Destination="$deployDir/alembic.ini"}
)

foreach ($item in $filesToDeploy) {
    if (Test-Path $item.Source) {
        Copy-Item -Path $item.Source -Destination $item.Destination -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Copié: $($item.Source)"
    }
}

Write-Info "Création archive ZIP..."
$archiveName = "iapostemanage_deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
Compress-Archive -Path "$deployDir/*" -DestinationPath $archiveName -Force
Write-Success "Archive créée: $archiveName"

# Étape 8: Génération script d'installation PythonAnywhere
Write-Step "8. Génération Script Installation"
$installScript = @"
#!/bin/bash
# Script d'installation PythonAnywhere - IA Poste Manager
# Généré automatiquement le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

set -e

echo "════════════════════════════════════════════════════════════"
echo "  Installation IA Poste Manager sur PythonAnywhere"
echo "════════════════════════════════════════════════════════════"

# 1. Créer virtualenv
echo "→ Création virtualenv..."
mkvirtualenv iapostemanage --python=python3.10

# 2. Aller dans le projet
cd ~/iapostemanage

# 3. Installer dépendances
echo "→ Installation dépendances..."
pip install -r requirements.txt

# 4. Installer bridge ASGI-WSGI (CRITIQUE)
echo "→ Installation asgiref..."
pip install asgiref

# 5. Créer dossier data
echo "→ Création dossier data..."
mkdir -p data

# 6. Initialiser database
echo "→ Initialisation database..."
python -c "from src.backend.database import init_db; init_db()"

# 7. Test import
echo "→ Test import..."
python -c "from src.backend.main_fastapi import app; print('✓ Import OK')"

# 8. Vérification finale
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✓ Installation terminée !"
echo ""
echo "Prochaines étapes:"
echo "1. Configurer WSGI file dans Web → WSGI configuration"
echo "2. Reload l'application"
echo "3. Tester: https://VOTRE_USERNAME.pythonanywhere.com/health"
echo "════════════════════════════════════════════════════════════"
"@

$installScript | Out-File -FilePath "$deployDir/install.sh" -Encoding UTF8
Write-Success "Script install.sh créé"

# Étape 9: Checklist finale
Write-Step "9. Checklist Finale"

Write-Host "`n📋 CHECKLIST DÉPLOIEMENT:" -ForegroundColor Cyan
Write-Host "  [ ] Compte PythonAnywhere créé" -ForegroundColor Yellow
Write-Host "  [ ] Archive uploadée: $archiveName" -ForegroundColor Yellow
Write-Host "  [ ] Fichiers extraits dans ~/iapostemanage" -ForegroundColor Yellow
Write-Host "  [ ] Script install.sh exécuté: bash install.sh" -ForegroundColor Yellow
Write-Host "  [ ] WSGI file configuré (remplacer username ligne 10)" -ForegroundColor Yellow
Write-Host "  [ ] Application reloadée" -ForegroundColor Yellow
Write-Host "  [ ] Tests endpoints: /health, /docs" -ForegroundColor Yellow

# Résumé final
Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✓ PRÉPARATION TERMINÉE                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📦 FICHIERS GÉNÉRÉS:" -ForegroundColor Cyan
Write-Host "  → $archiveName (archive déploiement)" -ForegroundColor White
Write-Host "  → $deployDir/install.sh (script installation)" -ForegroundColor White
Write-Host "  → requirements-frozen.txt (versions exactes)" -ForegroundColor White

Write-Host "`n📚 DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "  → GUIDE_DEPLOIEMENT_FINAL.md" -ForegroundColor White
Write-Host "  → CHECKLIST_DEPLOYMENT.md" -ForegroundColor White
Write-Host "  → DEPLOY_PYTHONANYWHERE.md" -ForegroundColor White

Write-Host "`n🚀 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host "  1. Aller sur https://www.pythonanywhere.com" -ForegroundColor White
Write-Host "  2. Créer compte gratuit (Beginner)" -ForegroundColor White
Write-Host "  3. Files → Upload → $archiveName" -ForegroundColor White
Write-Host "  4. Console → Bash:" -ForegroundColor White
Write-Host "     cd ~" -ForegroundColor Gray
Write-Host "     unzip $archiveName" -ForegroundColor Gray
Write-Host "     mv deploy_pythonanywhere iapostemanage" -ForegroundColor Gray
Write-Host "     cd iapostemanage" -ForegroundColor Gray
Write-Host "     bash install.sh" -ForegroundColor Gray
Write-Host "  5. Suivre GUIDE_DEPLOIEMENT_FINAL.md pour WSGI config" -ForegroundColor White

Write-Host "`n⏱️  Temps estimé: 25 minutes" -ForegroundColor Yellow
Write-Host "💰 Coût: 0€ (gratuit)`n" -ForegroundColor Yellow

# Ouvrir dossier deploy
if ($allFilesPresent) {
    Write-Host "[?] Ouvrir dossier deploy ? (O/N): " -ForegroundColor Cyan -NoNewline
    $response = Read-Host
    if ($response -eq "O" -or $response -eq "o") {
        Invoke-Item $deployDir
    }
}

Write-Host ""
Write-Host "Bon deploiement !" -ForegroundColor Green
Write-Host ""
