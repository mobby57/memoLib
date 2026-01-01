#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script PowerShell pour lancer tous les tests unitaires avec coverage

.DESCRIPTION
    Exécute les tests backend (pytest) et frontend (jest) avec rapports de couverture
    Génère des rapports HTML et affiche les statistiques

.PARAMETER Backend
    Lancer uniquement les tests backend

.PARAMETER Frontend
    Lancer uniquement les tests frontend

.PARAMETER Coverage
    Générer les rapports de couverture (activé par défaut)

.PARAMETER Watch
    Mode watch pour développement (relance auto des tests)

.EXAMPLE
    .\run_tests.ps1
    Lancer tous les tests avec coverage

.EXAMPLE
    .\run_tests.ps1 -Backend
    Lancer uniquement les tests backend

.EXAMPLE
    .\run_tests.ps1 -Watch
    Mode développement avec auto-reload
#>

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Coverage = $true,
    [switch]$Watch,
    [switch]$Verbose,
    [string]$TestPath = ""
)

# Configuration
$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

# Couleurs
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ $Message" "Cyan"
}

# ============================================
# VÉRIFICATIONS PRÉALABLES
# ============================================

Write-Header "VÉRIFICATIONS ENVIRONNEMENT"

# Vérifier Python
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Python détecté: $pythonVersion"
} catch {
    Write-Error-Custom "Python non trouvé. Installez Python 3.9+"
    exit 1
}

# Vérifier Node.js (pour tests frontend)
if (-not $Backend) {
    try {
        $nodeVersion = node --version 2>&1
        Write-Success "Node.js détecté: $nodeVersion"
    } catch {
        Write-Error-Custom "Node.js non trouvé (requis pour tests frontend)"
        if (-not $Backend) {
            exit 1
        }
    }
}

# ============================================
# TESTS BACKEND (PYTEST)
# ============================================

if (-not $Frontend) {
    Write-Header "TESTS BACKEND (Python/Flask)"
    
    # Aller dans le répertoire backend
    Push-Location "core\backend"
    
    try {
        # Vérifier pytest installé
        try {
            $pytestVersion = pytest --version 2>&1
            Write-Success "pytest détecté: $pytestVersion"
        } catch {
            Write-Info "Installation de pytest..."
            pip install pytest pytest-cov pytest-mock pytest-flask -q
        }
        
        # Construire la commande pytest
        $pytestCmd = "pytest"
        $pytestArgs = @()
        
        if ($TestPath) {
            $pytestArgs += $TestPath
        } else {
            $pytestArgs += "tests/"
        }
        
        # Options verbosité
        if ($Verbose) {
            $pytestArgs += "-vv"
        } else {
            $pytestArgs += "-v"
        }
        
        # Coverage
        if ($Coverage) {
            $pytestArgs += @(
                "--cov=.",
                "--cov-report=html",
                "--cov-report=term-missing",
                "--cov-report=json"
            )
        }
        
        # Mode watch
        if ($Watch) {
            $pytestArgs += "--watch"
        }
        
        # Autres options
        $pytestArgs += @(
            "--tb=short",
            "--color=yes"
        )
        
        Write-Info "Commande: $pytestCmd $($pytestArgs -join ' ')"
        Write-Host ""
        
        # Exécuter pytest
        $pytestProcess = Start-Process -FilePath "pytest" `
                                       -ArgumentList $pytestArgs `
                                       -NoNewWindow `
                                       -Wait `
                                       -PassThru
        
        $backendExitCode = $pytestProcess.ExitCode
        
        if ($backendExitCode -eq 0) {
            Write-Host ""
            Write-Success "Tests backend RÉUSSIS ✓"
            
            # Afficher rapport coverage
            if ($Coverage -and (Test-Path "htmlcov\index.html")) {
                Write-Host ""
                Write-Info "Rapport de couverture généré: core\backend\htmlcov\index.html"
                
                # Lire coverage.json pour afficher stats
                if (Test-Path "coverage.json") {
                    try {
                        $coverageData = Get-Content "coverage.json" | ConvertFrom-Json
                        $totalCoverage = $coverageData.totals.percent_covered
                        
                        if ($totalCoverage -ge 80) {
                            Write-Success "Couverture totale: $([math]::Round($totalCoverage, 2))% ✓"
                        } elseif ($totalCoverage -ge 60) {
                            Write-ColorOutput "Couverture totale: $([math]::Round($totalCoverage, 2))% ⚠" "Yellow"
                        } else {
                            Write-ColorOutput "Couverture totale: $([math]::Round($totalCoverage, 2))% ✗ (< 60%)" "Red"
                        }
                    } catch {
                        Write-Info "Impossible de lire les stats de couverture"
                    }
                }
                
                # Demander si ouvrir rapport
                $openReport = Read-Host "`nOuvrir le rapport HTML de couverture? (O/N)"
                if ($openReport -eq 'O' -or $openReport -eq 'o') {
                    Start-Process "htmlcov\index.html"
                }
            }
        } else {
            Write-Host ""
            Write-Error-Custom "Tests backend ÉCHOUÉS ✗ (Exit code: $backendExitCode)"
        }
        
    } finally {
        Pop-Location
    }
}

# ============================================
# TESTS FRONTEND (JEST)
# ============================================

if (-not $Backend) {
    Write-Header "TESTS FRONTEND (Next.js/React)"
    
    # Aller dans le répertoire frontend
    Push-Location "nextjs-app"
    
    try {
        # Vérifier si package.json existe
        if (-not (Test-Path "package.json")) {
            Write-Error-Custom "package.json non trouvé dans nextjs-app/"
            Pop-Location
            exit 1
        }
        
        # Vérifier jest configuré
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        if (-not $packageJson.scripts.test) {
            Write-Info "Configuration de Jest pour Next.js..."
            
            # Installer dépendances de test
            Write-Info "Installation des dépendances de test..."
            npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
            
            # Créer jest.config.js
            $jestConfig = @"
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
"@
            Set-Content -Path "jest.config.js" -Value $jestConfig
            
            # Créer jest.setup.js
            $jestSetup = @"
import '@testing-library/jest-dom'
"@
            Set-Content -Path "jest.setup.js" -Value $jestSetup
            
            Write-Success "Jest configuré ✓"
        }
        
        # Construire commande npm test
        $npmCmd = "npm"
        $npmArgs = @("test")
        
        if ($Coverage) {
            $npmArgs += @("--", "--coverage")
        }
        
        if ($Watch) {
            $npmArgs += @("--", "--watch")
        }
        
        Write-Info "Commande: $npmCmd $($npmArgs -join ' ')"
        Write-Host ""
        
        # Exécuter tests
        $npmProcess = Start-Process -FilePath "npm" `
                                     -ArgumentList $npmArgs `
                                     -NoNewWindow `
                                     -Wait `
                                     -PassThru
        
        $frontendExitCode = $npmProcess.ExitCode
        
        if ($frontendExitCode -eq 0) {
            Write-Host ""
            Write-Success "Tests frontend RÉUSSIS ✓"
            
            if ($Coverage -and (Test-Path "coverage\lcov-report\index.html")) {
                Write-Info "Rapport de couverture: nextjs-app\coverage\lcov-report\index.html"
            }
        } else {
            Write-Host ""
            Write-Error-Custom "Tests frontend ÉCHOUÉS ✗ (Exit code: $frontendExitCode)"
        }
        
    } finally {
        Pop-Location
    }
}

# ============================================
# RÉSUMÉ FINAL
# ============================================

Write-Header "RÉSUMÉ DES TESTS"

$totalExitCode = 0

if (-not $Frontend) {
    if ($backendExitCode -eq 0) {
        Write-Success "Backend: RÉUSSI ✓"
    } else {
        Write-Error-Custom "Backend: ÉCHOUÉ ✗"
        $totalExitCode = 1
    }
}

if (-not $Backend) {
    if ($frontendExitCode -eq 0) {
        Write-Success "Frontend: RÉUSSI ✓"
    } else {
        Write-Error-Custom "Frontend: ÉCHOUÉ ✗"
        $totalExitCode = 1
    }
}

Write-Host ""
if ($totalExitCode -eq 0) {
    Write-ColorOutput "═══════════════════════════════════════" "Green"
    Write-ColorOutput "   TOUS LES TESTS RÉUSSIS ✓ ✓ ✓" "Green"
    Write-ColorOutput "═══════════════════════════════════════" "Green"
} else {
    Write-ColorOutput "═══════════════════════════════════════" "Red"
    Write-ColorOutput "   CERTAINS TESTS ONT ÉCHOUÉ ✗" "Red"
    Write-ColorOutput "═══════════════════════════════════════" "Red"
}

Write-Host ""

# Ouvrir rapports si demandé
if ($Coverage) {
    Write-Info "Rapports de couverture disponibles:"
    if (Test-Path "core\backend\htmlcov\index.html") {
        Write-Host "  - Backend:  core\backend\htmlcov\index.html"
    }
    if (Test-Path "nextjs-app\coverage\lcov-report\index.html") {
        Write-Host "  - Frontend: nextjs-app\coverage\lcov-report\index.html"
    }
}

exit $totalExitCode
