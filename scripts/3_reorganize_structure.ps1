# ========================================
# SCRIPT 3: REORGANISATION DE LA STRUCTURE
# ========================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  REORGANISATION DU PROJET IAPOSTEMANAGE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Users\moros\Desktop\iaPostemanage"

Write-Host "AVERTISSEMENT: Ce script va RENOMMER et DEPLACER des dossiers!" -ForegroundColor Yellow
Write-Host "Fermez tous les editeurs et terminaux." -ForegroundColor Yellow
Write-Host ""
Write-Host "Continuer? (O/N): " -NoNewline -ForegroundColor Yellow
$Confirmation = Read-Host
if ($Confirmation -ne "O" -and $Confirmation -ne "o") {
    Write-Host "Annule." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 1: CREATION NOUVELLE STRUCTURE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$NewStructure = @(
    "src",
    "src\frontend",
    "src\backend",
    "src\backend\models",
    "src\backend\routes",
    "src\backend\services",
    "docker",
    "tests",
    "tests\unit",
    "tests\integration"
)

Write-Host "[1/5] Creation dossiers..." -ForegroundColor Yellow
Write-Host ""

foreach ($Dir in $NewStructure) {
    $FullPath = Join-Path $ProjectRoot $Dir
    if (-not (Test-Path $FullPath)) {
        Write-Host "  Creation: $Dir" -ForegroundColor Gray
        New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        Write-Host "    [OK]" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 2: DEPLACEMENT FRONTEND" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[2/5] Reorganisation frontend React..." -ForegroundColor Yellow
Write-Host ""

$FrontendSrc = Join-Path $ProjectRoot "frontend-react"
$FrontendDest = Join-Path $ProjectRoot "src\frontend"

if (Test-Path $FrontendSrc) {
    Write-Host "  Deplacement: frontend-react -> src/frontend" -ForegroundColor Gray
    
    try {
        Get-ChildItem -Path $FrontendSrc -Recurse | ForEach-Object {
            $RelativePath = $_.FullName.Substring($FrontendSrc.Length)
            $DestPath = Join-Path $FrontendDest $RelativePath
            
            if ($_.PSIsContainer) {
                if (-not (Test-Path $DestPath)) {
                    New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
                }
            } else {
                $DestDir = Split-Path $DestPath -Parent
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                Copy-Item -Path $_.FullName -Destination $DestPath -Force
            }
        }
        
        Write-Host "    [OK] Frontend deplace" -ForegroundColor Green
        
        $ArchivePath = Join-Path $ProjectRoot "archive\frontend-react_$(Get-Date -Format 'yyyyMMdd')"
        Move-Item -Path $FrontendSrc -Destination $ArchivePath -Force
        Write-Host "    [OK] Ancien archive" -ForegroundColor Green
        
    } catch {
        Write-Host "    [!] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 3: REORGANISATION BACKEND" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[3/5] Reorganisation backend Flask..." -ForegroundColor Yellow
Write-Host ""

$BackendDest = Join-Path $ProjectRoot "src\backend"

$MainApp = Join-Path $ProjectRoot "app_unified_fixed.py"
if (Test-Path $MainApp) {
    Write-Host "  Deplacement: app_unified_fixed.py -> src/backend/app.py" -ForegroundColor Gray
    Copy-Item -Path $MainApp -Destination (Join-Path $BackendDest "app.py") -Force
    Move-Item -Path $MainApp -Destination (Join-Path $ProjectRoot "archive\app_unified_fixed_$(Get-Date -Format 'yyyyMMdd').py") -Force
    Write-Host "    [OK]" -ForegroundColor Green
}

$BackendApi = Join-Path $ProjectRoot "backend_api.py"
if (Test-Path $BackendApi) {
    Write-Host "  Deplacement: backend_api.py -> src/backend/api.py" -ForegroundColor Gray
    Copy-Item -Path $BackendApi -Destination (Join-Path $BackendDest "api.py") -Force
    Move-Item -Path $BackendApi -Destination (Join-Path $ProjectRoot "archive\backend_api_$(Get-Date -Format 'yyyyMMdd').py") -Force
    Write-Host "    [OK]" -ForegroundColor Green
}

$RequirementsSrc = Join-Path $ProjectRoot "requirements.txt"
if (Test-Path $RequirementsSrc) {
    Write-Host "  Copie: requirements.txt -> src/backend/" -ForegroundColor Gray
    Copy-Item -Path $RequirementsSrc -Destination (Join-Path $BackendDest "requirements.txt") -Force
    Write-Host "    [OK]" -ForegroundColor Green
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 4: REORGANISATION DOCKER" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[4/5] Organisation configs Docker..." -ForegroundColor Yellow
Write-Host ""

$DockerDest = Join-Path $ProjectRoot "docker"

$DockerFiles = @{
    "Dockerfile" = "Dockerfile.main"
    "docker-compose.yml" = "docker-compose.yml"
    "docker-compose.prod.yml" = "docker-compose.prod.yml"
    "docker-compose.minimal.yml" = "docker-compose.dev.yml"
    "docker-compose.monitoring.yml" = "docker-compose.monitoring.yml"
    "docker-compose.fast.yml" = "docker-compose.fast.yml"
}

foreach ($Source in $DockerFiles.Keys) {
    $Dest = $DockerFiles[$Source]
    $SourcePath = Join-Path $ProjectRoot $Source
    $DestPath = Join-Path $DockerDest $Dest
    
    if (Test-Path $SourcePath) {
        Copy-Item -Path $SourcePath -Destination $DestPath -Force
    }
}

Write-Host "  [OK] Configs Docker copiees" -ForegroundColor Green
Write-Host "  Note: Originaux conserves a la racine pour compatibilite" -ForegroundColor Cyan

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 5: REORGANISATION TESTS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[5/5] Organisation tests..." -ForegroundColor Yellow
Write-Host ""

$E2ETests = Join-Path $ProjectRoot "src\frontend\tests"
if (Test-Path $E2ETests) {
    Write-Host "  [OK] Tests E2E avec frontend" -ForegroundColor Green
}

$TestsRoot = Join-Path $ProjectRoot "tests"
if (Test-Path $TestsRoot) {
    $UnitTests = Get-ChildItem -Path $TestsRoot -Filter "test_*.py" -File
    
    if ($UnitTests.Count -gt 0) {
        $UnitDest = Join-Path $ProjectRoot "tests\unit"
        foreach ($Test in $UnitTests) {
            Copy-Item -Path $Test.FullName -Destination (Join-Path $UnitDest $Test.Name) -Force
        }
        Write-Host "  [OK] Tests unitaires organises" -ForegroundColor Green
    }
}

Write-Host ""

# README structure
$StructureReadme = @"
# Nouvelle Structure du Projet

Reorganise: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## Structure Simplifiee

iaPostemanage/
├── src/
│   ├── frontend/         # Application React
│   │   ├── src/
│   │   ├── tests/        # Tests E2E Playwright
│   │   ├── package.json
│   │   └── vite.config.js
│   └── backend/          # Application Flask
│       ├── app.py
│       ├── models/
│       ├── routes/
│       └── requirements.txt
├── docker/               # Configurations Docker
├── tests/                # Tests centralises
├── docs/                 # Documentation
├── scripts/              # Scripts
└── archive/              # Anciennes versions

## Commandes Demarrage

Backend:
  cd src\backend
  python app.py

Frontend:
  cd src\frontend
  npm run dev

Tests:
  cd src\frontend
  npx playwright test

Docker Dev:
  docker-compose -f docker/docker-compose.dev.yml up

## Changements

1. frontend-react/ -> src/frontend/
2. app_unified_fixed.py -> src/backend/app.py
3. Configs Docker -> docker/
4. Documentation -> docs/
5. Tests centralises -> tests/

## Prochaines Etapes

1. Valider: .\scripts\4_validate_structure.ps1
2. Installer dependances
3. Tester application
"@

$StructureReadme | Out-File -FilePath (Join-Path $ProjectRoot "NOUVELLE_STRUCTURE.md") -Encoding UTF8

# Resume
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  [OK] REORGANISATION TERMINEE" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NOUVELLE STRUCTURE CREEE:" -ForegroundColor Cyan
Write-Host "  src/frontend/     Frontend React + Tests E2E" -ForegroundColor White
Write-Host "  src/backend/      Backend Flask" -ForegroundColor White
Write-Host "  docker/           Configurations Docker" -ForegroundColor White
Write-Host "  tests/            Tests unitaires" -ForegroundColor White
Write-Host "  docs/             Documentation" -ForegroundColor White
Write-Host "  archive/          Anciennes versions" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: NOUVELLE_STRUCTURE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Fichiers Docker conserves a la racine" -ForegroundColor Yellow
Write-Host ""
Write-Host "Etape suivante:" -ForegroundColor Yellow
Write-Host "  .\scripts\4_validate_structure.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
