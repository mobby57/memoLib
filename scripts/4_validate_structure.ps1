# ========================================
# SCRIPT 4: VALIDATION DE LA STRUCTURE
# ========================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VALIDATION DE LA NOUVELLE STRUCTURE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Users\moros\Desktop\iaPostemanage"
$ErrorsFound = 0
$WarningsFound = 0
$ChecksPassed = 0

function Test-PathExists {
    param (
        [string]$Path,
        [string]$Description,
        [bool]$Required = $true
    )
    
    if (Test-Path $Path) {
        Write-Host "  [OK] $Description" -ForegroundColor Green
        $script:ChecksPassed++
        return $true
    } else {
        if ($Required) {
            Write-Host "  [!] MANQUANT: $Description" -ForegroundColor Red
            $script:ErrorsFound++
        } else {
            Write-Host "  [?] Optionnel: $Description" -ForegroundColor Yellow
            $script:WarningsFound++
        }
        return $false
    }
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION 1: STRUCTURE DOSSIERS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Structure principale..." -ForegroundColor Yellow
Write-Host ""

Test-PathExists (Join-Path $ProjectRoot "src") "Dossier src/" $true
Test-PathExists (Join-Path $ProjectRoot "src\frontend") "Dossier src/frontend/" $true
Test-PathExists (Join-Path $ProjectRoot "src\backend") "Dossier src/backend/" $true
Test-PathExists (Join-Path $ProjectRoot "docker") "Dossier docker/" $true
Test-PathExists (Join-Path $ProjectRoot "tests") "Dossier tests/" $true
Test-PathExists (Join-Path $ProjectRoot "docs") "Dossier docs/" $true
Test-PathExists (Join-Path $ProjectRoot "scripts") "Dossier scripts/" $true
Test-PathExists (Join-Path $ProjectRoot "archive") "Dossier archive/" $true

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION 2: FICHIERS FRONTEND" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[2/6] Frontend React..." -ForegroundColor Yellow
Write-Host ""

$FrontendPath = Join-Path $ProjectRoot "src\frontend"

Test-PathExists (Join-Path $FrontendPath "package.json") "package.json" $true
Test-PathExists (Join-Path $FrontendPath "vite.config.js") "vite.config.js" $true
Test-PathExists (Join-Path $FrontendPath "playwright.config.js") "playwright.config.js" $true
Test-PathExists (Join-Path $FrontendPath "src") "Dossier src/" $true
Test-PathExists (Join-Path $FrontendPath "src\App.jsx") "App.jsx" $true
Test-PathExists (Join-Path $FrontendPath "src\pages") "Dossier pages/" $true
Test-PathExists (Join-Path $FrontendPath "tests") "Dossier tests/" $true
Test-PathExists (Join-Path $FrontendPath "tests\e2e") "Dossier tests/e2e/" $true

if (Test-Path (Join-Path $FrontendPath "node_modules")) {
    Write-Host "  [OK] node_modules/ installe" -ForegroundColor Green
    $script:ChecksPassed++
} else {
    Write-Host "  [?] node_modules/ non installe - executer npm install" -ForegroundColor Yellow
    $script:WarningsFound++
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION 3: FICHIERS BACKEND" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[3/6] Backend Flask..." -ForegroundColor Yellow
Write-Host ""

$BackendPath = Join-Path $ProjectRoot "src\backend"

Test-PathExists (Join-Path $BackendPath "app.py") "app.py (principal)" $true
Test-PathExists (Join-Path $BackendPath "requirements.txt") "requirements.txt" $true
Test-PathExists (Join-Path $BackendPath "models") "Dossier models/" $false
Test-PathExists (Join-Path $BackendPath "routes") "Dossier routes/" $false
Test-PathExists (Join-Path $BackendPath "services") "Dossier services/" $false

try {
    $PythonVersion = python --version 2>&1
    Write-Host "  [OK] Python disponible: $PythonVersion" -ForegroundColor Green
    $script:ChecksPassed++
} catch {
    Write-Host "  [!] Python non trouve" -ForegroundColor Red
    $script:ErrorsFound++
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION 4: CONFIGURATIONS DOCKER" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[4/6] Fichiers Docker..." -ForegroundColor Yellow
Write-Host ""

$DockerPath = Join-Path $ProjectRoot "docker"

Test-PathExists (Join-Path $DockerPath "Dockerfile.main") "Dockerfile.main" $true
Test-PathExists (Join-Path $DockerPath "docker-compose.yml") "docker-compose.yml" $true
Test-PathExists (Join-Path $DockerPath "docker-compose.dev.yml") "docker-compose.dev.yml" $true
Test-PathExists (Join-Path $DockerPath "docker-compose.prod.yml") "docker-compose.prod.yml" $false

Write-Host ""
Write-Host "  Compatibilite (fichiers racine):" -ForegroundColor Cyan
Test-PathExists (Join-Path $ProjectRoot "Dockerfile") "Dockerfile (racine)" $false
Test-PathExists (Join-Path $ProjectRoot "docker-compose.yml") "docker-compose.yml (racine)" $false

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION 5: DOCUMENTATION" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[5/6] Documentation..." -ForegroundColor Yellow
Write-Host ""

$DocsPath = Join-Path $ProjectRoot "docs"

Test-PathExists (Join-Path $DocsPath "INDEX.md") "INDEX.md" $true
Test-PathExists (Join-Path $ProjectRoot "README.md") "README.md (racine)" $true
Test-PathExists (Join-Path $ProjectRoot "STRUCTURE_PROJET_COMPLETE.md") "STRUCTURE_PROJET_COMPLETE.md" $true
Test-PathExists (Join-Path $ProjectRoot "NOUVELLE_STRUCTURE.md") "NOUVELLE_STRUCTURE.md" $true

$DocsCount = (Get-ChildItem -Path $DocsPath -Filter "*.md" -Recurse -File -ErrorAction SilentlyContinue).Count
Write-Host "  Info: $DocsCount fichiers documentation" -ForegroundColor Cyan

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION 6: TESTS FONCTIONNELS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[6/6] Tests fonctionnalite..." -ForegroundColor Yellow
Write-Host ""

# Test package.json
$PackageJsonPath = Join-Path $FrontendPath "package.json"
if (Test-Path $PackageJsonPath) {
    try {
        $PackageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
        Write-Host "  [OK] package.json valide" -ForegroundColor Green
        Write-Host "      Nom: $($PackageJson.name)" -ForegroundColor Gray
        Write-Host "      Version: $($PackageJson.version)" -ForegroundColor Gray
        $script:ChecksPassed++
    } catch {
        Write-Host "  [!] package.json invalide" -ForegroundColor Red
        $script:ErrorsFound++
    }
}

# Test app.py
$AppPyPath = Join-Path $BackendPath "app.py"
if (Test-Path $AppPyPath) {
    try {
        $AppContent = Get-Content $AppPyPath -Raw
        if ($AppContent -match "Flask" -and $AppContent -match "app = Flask") {
            Write-Host "  [OK] app.py contient Flask" -ForegroundColor Green
            $script:ChecksPassed++
        } else {
            Write-Host "  [?] app.py ne semble pas etre Flask standard" -ForegroundColor Yellow
            $script:WarningsFound++
        }
    } catch {
        Write-Host "  [!] Impossible de lire app.py" -ForegroundColor Red
        $script:ErrorsFound++
    }
}

# Test ports
$PlaywrightConfigPath = Join-Path $FrontendPath "playwright.config.js"
if (Test-Path $PlaywrightConfigPath) {
    $PlaywrightContent = Get-Content $PlaywrightConfigPath -Raw
    
    if ($PlaywrightContent -match "localhost:3001") {
        Write-Host "  [OK] playwright.config.js port 3001" -ForegroundColor Green
        $script:ChecksPassed++
    } else {
        Write-Host "  [?] playwright.config.js pas port 3001" -ForegroundColor Yellow
        $script:WarningsFound++
    }
}

# Test requirements
$RequirementsTxt = Join-Path $BackendPath "requirements.txt"
if (Test-Path $RequirementsTxt) {
    $Requirements = Get-Content $RequirementsTxt
    
    $HasFlask = $Requirements -match "Flask"
    $HasCors = $Requirements -match "flask-cors"
    
    if ($HasFlask) {
        Write-Host "  [OK] Flask dans requirements.txt" -ForegroundColor Green
        $script:ChecksPassed++
    } else {
        Write-Host "  [!] Flask manquant" -ForegroundColor Red
        $script:ErrorsFound++
    }
    
    if ($HasCors) {
        Write-Host "  [OK] flask-cors dans requirements.txt" -ForegroundColor Green
        $script:ChecksPassed++
    } else {
        Write-Host "  [?] flask-cors manquant (recommande)" -ForegroundColor Yellow
        $script:WarningsFound++
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  RESUME DES VERIFICATIONS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$TotalChecks = $ChecksPassed + $ErrorsFound + $WarningsFound

Write-Host "STATISTIQUES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Reussies:  $ChecksPassed" -ForegroundColor Green
Write-Host "  [!]  Erreurs:   $ErrorsFound" -ForegroundColor $(if ($ErrorsFound -gt 0) { "Red" } else { "Green" })
Write-Host "  [?]  Warnings:  $WarningsFound" -ForegroundColor $(if ($WarningsFound -gt 0) { "Yellow" } else { "Green" })
Write-Host "  ---  Total:     $TotalChecks" -ForegroundColor White
Write-Host ""

$Score = [math]::Round(($ChecksPassed / $TotalChecks) * 100, 1)

Write-Host "SCORE: $Score%" -ForegroundColor $(
    if ($Score -ge 90) { "Green" }
    elseif ($Score -ge 70) { "Yellow" }
    else { "Red" }
)
Write-Host ""

if ($ErrorsFound -eq 0 -and $WarningsFound -eq 0) {
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "  VALIDATION PARFAITE" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Projet correctement structure!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Installer dependances frontend:" -ForegroundColor White
    Write-Host "   cd src\frontend" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Installer dependances backend:" -ForegroundColor White
    Write-Host "   cd src\backend" -ForegroundColor Gray
    Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Demarrer application:" -ForegroundColor White
    Write-Host "   Backend: cd src\backend && python app.py" -ForegroundColor Gray
    Write-Host "   Frontend: cd src\frontend && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Lancer tests E2E:" -ForegroundColor White
    Write-Host "   cd src\frontend && npx playwright test" -ForegroundColor Gray
    
} elseif ($ErrorsFound -eq 0) {
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host "  VALIDATION REUSSIE AVEC WARNINGS" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Structure correcte mais ameliorations possibles." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ACTIONS RECOMMANDEES:" -ForegroundColor Yellow
    Write-Host "  - Verifier warnings ci-dessus" -ForegroundColor White
    Write-Host "  - Installer dependances manquantes" -ForegroundColor White
    
} else {
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "  VALIDATION ECHOUEE" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreurs critiques detectees." -ForegroundColor Red
    Write-Host ""
    Write-Host "ACTIONS REQUISES:" -ForegroundColor Red
    Write-Host "  1. Corriger erreurs ci-dessus" -ForegroundColor White
    Write-Host "  2. Relancer validation" -ForegroundColor White
    Write-Host "  3. Consulter NOUVELLE_STRUCTURE.md" -ForegroundColor White
    Write-Host ""
    Write-Host "  Restaurer backup si necessaire:" -ForegroundColor Yellow
    Write-Host "  C:\Users\moros\Desktop\iaPostemanage_BACKUPS\" -ForegroundColor Gray
}

Write-Host ""

# Rapport
$ReportContent = @"
# RAPPORT DE VALIDATION

Date: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## Resultats

- Verifications reussies: $ChecksPassed
- Erreurs critiques: $ErrorsFound
- Avertissements: $WarningsFound
- Score: $Score%

## Structure Validee

Dossiers principaux:
- src/ (code source)
- docker/ (configurations)
- tests/ (tests)
- docs/ (documentation)
- scripts/ (utilitaires)
- archive/ (anciennes versions)

## Commandes Rapides

### Developpement
Backend: cd src\backend && python app.py
Frontend: cd src\frontend && npm run dev
Tests: cd src\frontend && npx playwright test

### Docker
Dev: docker-compose -f docker/docker-compose.dev.yml up
Prod: docker-compose -f docker/docker-compose.yml up -d

## Notes

$(if ($ErrorsFound -eq 0 -and $WarningsFound -eq 0) {
    "Aucun probleme. Projet pret."
} elseif ($ErrorsFound -eq 0) {
    "Warnings mineurs. Projet fonctionnel."
} else {
    "Erreurs critiques a corriger."
})
"@

$ReportPath = Join-Path $ProjectRoot "RAPPORT_VALIDATION.md"
$ReportContent | Out-File -FilePath $ReportPath -Encoding UTF8

Write-Host "Rapport: RAPPORT_VALIDATION.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
