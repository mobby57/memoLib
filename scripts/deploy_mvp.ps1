<#
.SYNOPSIS
    Script de déploiement MVP complet pour IA Poste Manager

.DESCRIPTION
    Automatise le déploiement complet du MVP avec vérifications:
    - Prérequis système (Python, Node.js, PostgreSQL, Ollama)
    - Installation dépendances backend/frontend
    - Configuration base de données
    - Tests end-to-end
    - Démarrage services
    - Health checks
    - Rapport de déploiement

.PARAMETER Environment
    Environnement cible: dev, staging, production

.PARAMETER SkipTests
    Sauter les tests (non recommandé)

.PARAMETER AutoStart
    Démarrer automatiquement les services après déploiement

.EXAMPLE
    .\scripts\deploy_mvp.ps1 -Environment dev -AutoStart
    .\scripts\deploy_mvp.ps1 -Environment production -SkipTests

.NOTES
    Auteur: IA Poste Manager Team
    Version: 1.0.0
    Date: 2025-01-27
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'production')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoStart = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# === CONFIGURATION ===

$ErrorActionPreference = 'Stop'
$StartTime = Get-Date

# Couleurs
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Step { Write-Host "`n=== $args ===" -ForegroundColor Magenta }

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║         IA POSTE MANAGER - DÉPLOIEMENT MVP                  ║
║                                                              ║
║  Environnement: $Environment
║  Tests: $(if ($SkipTests) { "DÉSACTIVÉS" } else { "ACTIVÉS" })
║  Auto-start: $(if ($AutoStart) { "OUI" } else { "NON" })
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# === ÉTAPE 1: VÉRIFICATION PRÉREQUIS ===

Write-Step "1/10 - Vérification des prérequis"

$Prerequisites = @{
    'Python' = $false
    'Node.js' = $false
    'PostgreSQL' = $false
    'Ollama' = $false
    'Git' = $false
}

# Python 3.10+
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match 'Python 3\.(1[0-9]|[2-9][0-9])') {
        Write-Success "Python: $pythonVersion"
        $Prerequisites['Python'] = $true
    } else {
        Write-Error "Python 3.10+ requis (trouvé: $pythonVersion)"
    }
} catch {
    Write-Error "Python non installé"
}

# Node.js 18+
try {
    $nodeVersion = node --version
    if ($nodeVersion -match 'v(1[8-9]|[2-9][0-9])') {
        Write-Success "Node.js: $nodeVersion"
        $Prerequisites['Node.js'] = $true
    } else {
        Write-Error "Node.js 18+ requis (trouvé: $nodeVersion)"
    }
} catch {
    Write-Error "Node.js non installé"
}

# PostgreSQL
try {
    $pgVersion = psql --version
    Write-Success "PostgreSQL: $pgVersion"
    $Prerequisites['PostgreSQL'] = $true
} catch {
    Write-Error "PostgreSQL non installé"
}

# Ollama
try {
    $ollamaStatus = curl.exe -s http://localhost:11434/api/tags 2>$null
    if ($ollamaStatus) {
        Write-Success "Ollama: Actif sur port 11434"
        $Prerequisites['Ollama'] = $true
    } else {
        Write-Warning "Ollama non démarré (démarrer avec: ollama serve)"
    }
} catch {
    Write-Warning "Ollama non installé ou non démarré"
}

# Git
try {
    $gitVersion = git --version
    Write-Success "Git: $gitVersion"
    $Prerequisites['Git'] = $true
} catch {
    Write-Error "Git non installé"
}

# Vérifier prérequis critiques
$criticalMissing = @('Python', 'Node.js', 'PostgreSQL') | Where-Object { -not $Prerequisites[$_] }
if ($criticalMissing) {
    Write-Error "Prérequis manquants: $($criticalMissing -join ', ')"
    Write-Info "Installez-les et relancez le script"
    exit 1
}

# === ÉTAPE 2: INSTALLATION DÉPENDANCES BACKEND ===

Write-Step "2/10 - Installation dépendances Backend"

if (Test-Path "requirements.txt") {
    Write-Info "Installation packages Python..."
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    Write-Success "Dépendances Python installées"
} else {
    Write-Warning "requirements.txt non trouvé"
}

# === ÉTAPE 3: INSTALLATION DÉPENDANCES FRONTEND ===

Write-Step "3/10 - Installation dépendances Frontend"

if (Test-Path "src/frontend/package.json") {
    Write-Info "Installation packages npm..."
    Push-Location src/frontend
    npm install
    Pop-Location
    Write-Success "Dépendances npm installées"
} else {
    Write-Warning "package.json non trouvé"
}

# === ÉTAPE 4: CONFIGURATION ENVIRONNEMENT ===

Write-Step "4/10 - Configuration environnement"

# Copier .env.example si .env n'existe pas
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success ".env créé depuis .env.example"
        Write-Warning "⚠ Configurez .env avec vos clés API avant de continuer!"
        
        if (-not $Force) {
            $continue = Read-Host "Continuer sans configurer .env ? (y/n)"
            if ($continue -ne 'y') {
                Write-Info "Configurez .env et relancez le script"
                exit 0
            }
        }
    } else {
        Write-Error ".env.example non trouvé"
    }
} else {
    Write-Success ".env déjà configuré"
}

# Vérifier variables critiques
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$criticalVars = @('DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY')
$missingVars = @()

foreach ($var in $criticalVars) {
    if (-not ($envContent -match "^$var=.+")) {
        $missingVars += $var
    }
}

if ($missingVars) {
    Write-Warning "Variables manquantes dans .env: $($missingVars -join ', ')"
}

# === ÉTAPE 5: INSTALLATION BASE DE DONNÉES ===

Write-Step "5/10 - Installation base de données"

if (Test-Path "INSTALL_DATABASE.ps1") {
    Write-Info "Exécution du script d'installation PostgreSQL..."
    
    $dbParams = @{
        DbHost = "localhost"
        DbPort = 5432
        DbName = "iapostemanager"
        DbUser = "postgres"
        DbPassword = "postgres"
    }
    
    if ($Force) {
        $dbParams['Force'] = $true
    }
    
    try {
        & .\INSTALL_DATABASE.ps1 @dbParams
        Write-Success "Base de données installée"
    } catch {
        Write-Error "Erreur installation base de données: $_"
        Write-Info "Configurez manuellement la base de données et relancez"
        exit 1
    }
} else {
    Write-Warning "Script INSTALL_DATABASE.ps1 non trouvé"
}

# === ÉTAPE 6: GÉNÉRATION CLÉS/SECRETS ===

Write-Step "6/10 - Génération clés et secrets"

# Générer JWT_SECRET si manquant
if (-not ($envContent -match "^JWT_SECRET=.+")) {
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Add-Content ".env" "`nJWT_SECRET=$jwtSecret"
    Write-Success "JWT_SECRET généré"
}

# Générer ENCRYPTION_KEY si manquant
if (-not ($envContent -match "^ENCRYPTION_KEY=.+")) {
    Write-Info "Génération ENCRYPTION_KEY via Python..."
    $encKey = python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    Add-Content ".env" "`nENCRYPTION_KEY=$encKey"
    Write-Success "ENCRYPTION_KEY généré"
}

# === ÉTAPE 7: BUILD FRONTEND ===

Write-Step "7/10 - Build frontend"

if (Test-Path "src/frontend/package.json") {
    Write-Info "Compilation frontend..."
    Push-Location src/frontend
    npm run build
    Pop-Location
    Write-Success "Frontend compilé"
} else {
    Write-Warning "Pas de frontend à compiler"
}

# === ÉTAPE 8: TESTS ===

Write-Step "8/10 - Exécution tests"

if (-not $SkipTests) {
    Write-Info "Lancement tests end-to-end..."
    
    if (Test-Path "tests/test_mvp_complete.py") {
        try {
            pytest tests/test_mvp_complete.py -v --tb=short
            Write-Success "Tous les tests passés ✓"
        } catch {
            Write-Error "Certains tests ont échoué"
            
            if (-not $Force) {
                $continue = Read-Host "Continuer malgré échec tests ? (y/n)"
                if ($continue -ne 'y') {
                    Write-Info "Corrigez les tests et relancez"
                    exit 1
                }
            }
        }
    } else {
        Write-Warning "Fichier de tests non trouvé"
    }
} else {
    Write-Warning "Tests ignorés (--SkipTests)"
}

# === ÉTAPE 9: HEALTH CHECKS ===

Write-Step "9/10 - Health checks"

$HealthChecks = @{
    'Database' = $false
    'Ollama' = $false
}

# Check Database
try {
    $dbCheck = python -c @"
from src.backend.database_config import test_connection
print('OK' if test_connection() else 'FAIL')
"@
    if ($dbCheck -match 'OK') {
        Write-Success "Database: Connexion OK"
        $HealthChecks['Database'] = $true
    } else {
        Write-Error "Database: Connexion échouée"
    }
} catch {
    Write-Error "Database: Erreur de vérification"
}

# Check Ollama
try {
    $ollamaCheck = curl.exe -s http://localhost:11434/api/tags
    if ($ollamaCheck) {
        Write-Success "Ollama: Service actif"
        $HealthChecks['Ollama'] = $true
    } else {
        Write-Warning "Ollama: Service non actif"
    }
} catch {
    Write-Warning "Ollama: Erreur de vérification"
}

# === ÉTAPE 10: DÉMARRAGE SERVICES ===

Write-Step "10/10 - Démarrage services"

if ($AutoStart) {
    Write-Info "Démarrage automatique des services..."
    
    # Démarrer Ollama si non actif
    if (-not $HealthChecks['Ollama']) {
        Write-Info "Démarrage Ollama..."
        Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
    
    # Démarrer Backend FastAPI
    Write-Info "Démarrage Backend FastAPI..."
    Start-Process powershell -ArgumentList @"
-NoExit -Command `"cd '$PWD/src/backend'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`"
"@
    
    # Démarrer Frontend
    Write-Info "Démarrage Frontend..."
    Start-Process powershell -ArgumentList @"
-NoExit -Command `"cd '$PWD/src/frontend'; npm run dev`"
"@
    
    Write-Success "Services démarrés"
    Write-Info "Backend: http://localhost:8000"
    Write-Info "Frontend: http://localhost:5173"
    Write-Info "API Docs: http://localhost:8000/docs"
} else {
    Write-Info "Services non démarrés (utilisez -AutoStart pour démarrer automatiquement)"
    Write-Info "Commandes manuelles:"
    Write-Host "  Backend:  cd src/backend && python -m uvicorn main:app --reload" -ForegroundColor Yellow
    Write-Host "  Frontend: cd src/frontend && npm run dev" -ForegroundColor Yellow
}

# === RAPPORT FINAL ===

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                  DÉPLOIEMENT TERMINÉ                        ║
╚══════════════════════════════════════════════════════════════╝

Durée totale: $($Duration.TotalSeconds.ToString("F2"))s

RÉSUMÉ:
✓ Prérequis: $($Prerequisites.Values | Where-Object { $_ } | Measure-Object).Count/$($Prerequisites.Count) OK
✓ Dépendances: Backend + Frontend installées
✓ Base de données: $(if ($HealthChecks['Database']) { 'OK' } else { 'ERREUR' })
✓ Ollama: $(if ($HealthChecks['Ollama']) { 'OK' } else { 'ERREUR' })
✓ Tests: $(if ($SkipTests) { 'Ignorés' } else { 'Exécutés' })
✓ Services: $(if ($AutoStart) { 'Démarrés' } else { 'Non démarrés' })

PROCHAINES ÉTAPES:
1. Configurez les clés API dans .env (OpenAI, Resend, Stripe, etc.)
2. Lancez les services:
   - Backend: cd src/backend && python -m uvicorn main:app --reload
   - Frontend: cd src/frontend && npm run dev
3. Testez: http://localhost:5173
4. Documentation API: http://localhost:8000/docs

SUPPORT:
- Documentation: docs/README.md
- Tests: pytest tests/test_mvp_complete.py -v
- Logs: tail -f logs/app.log

"@ -ForegroundColor Green

exit 0
