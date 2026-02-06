# MemoLib - Script d'Application des Ameliorations
# Usage: .\apply-improvements.ps1

Write-Host "MemoLib - Application des Ameliorations" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

function Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "> $Message" -ForegroundColor Yellow
}

function Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Warning {
    param([string]$Message)
    Write-Host "  [!] $Message" -ForegroundColor Yellow
}

function Error {
    param([string]$Message)
    Write-Host "  [X] $Message" -ForegroundColor Red
}

Step "1. Verifications preliminaires..."

if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Success "Node.js installe: $nodeVersion"
} else {
    Error "Node.js n'est pas installe!"
    exit 1
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Success "npm installe: $npmVersion"
} else {
    Error "npm n'est pas installe!"
    exit 1
}

if (Get-Command git -ErrorAction SilentlyContinue) {
    Success "Git installe"
} else {
    Warning "Git n'est pas installe (optionnel)"
}

Step "2. Nettoyage du projet..."

Write-Host "  Voulez-vous nettoyer le projet? (y/n): " -NoNewline -ForegroundColor Cyan
$clean = Read-Host

if ($clean -eq "y" -or $clean -eq "Y") {
    if (Test-Path ".\clean-project.ps1") {
        & .\clean-project.ps1
        Success "Projet nettoye"
    } else {
        Warning "Script clean-project.ps1 non trouve"
    }
} else {
    Warning "Nettoyage ignore"
}

Step "3. Configuration de l'environnement..."

if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Success "Fichier .env.local cree depuis .env.example"
        Warning "N'oubliez pas de remplir les valeurs dans .env.local!"
    } else {
        Warning ".env.example non trouve"
    }
} else {
    Success ".env.local existe deja"
}

Step "4. Installation des dependances..."

Write-Host "  Voulez-vous reinstaller les dependances? (y/n): " -NoNewline -ForegroundColor Cyan
$install = Read-Host

if ($install -eq "y" -or $install -eq "Y") {
    Write-Host "  Installation en cours..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -eq 0) {
        Success "Dependances installees"
    } else {
        Error "Erreur lors de l'installation"
    }
} else {
    Warning "Installation ignoree"
}

Step "5. Generation du client Prisma..."

if (Test-Path "prisma\schema.prisma") {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Success "Client Prisma genere"
    } else {
        Error "Erreur lors de la generation Prisma"
    }
} else {
    Warning "schema.prisma non trouve"
}

Step "6. Audit des dependances..."

Write-Host "  Verification des dependances obsoletes..." -ForegroundColor Gray
npm outdated

Write-Host ""
Write-Host "  Verification des vulnerabilites..." -ForegroundColor Gray
npm audit

Success "Audit termine (voir resultats ci-dessus)"

Step "7. Verification de la qualite du code..."

Write-Host "  Linting..." -ForegroundColor Gray
npm run lint
if ($LASTEXITCODE -eq 0) {
    Success "Linting OK"
} else {
    Warning "Erreurs de linting detectees"
}

Write-Host ""
Write-Host "  Type-checking..." -ForegroundColor Gray
npm run type-check
if ($LASTEXITCODE -eq 0) {
    Success "Type-checking OK"
} else {
    Warning "Erreurs TypeScript detectees"
}

Step "8. Test du build..."

Write-Host "  Voulez-vous tester le build? (y/n): " -NoNewline -ForegroundColor Cyan
$build = Read-Host

if ($build -eq "y" -or $build -eq "Y") {
    Write-Host "  Build en cours (peut prendre quelques minutes)..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Success "Build reussi!"
    } else {
        Error "Erreur lors du build"
    }
} else {
    Warning "Build ignore"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] Application des ameliorations terminee!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "  1. Remplir les valeurs dans .env.local" -ForegroundColor White
Write-Host "  2. Supprimer les fichiers .pem et les stocker dans GitHub Secrets" -ForegroundColor White
Write-Host "  3. Executer: npm run deps:unused" -ForegroundColor White
Write-Host "  4. Resoudre les erreurs TypeScript si detectees" -ForegroundColor White
Write-Host "  5. Supprimer les dossiers legacy manuellement" -ForegroundColor White
Write-Host "  6. Demarrer le serveur: npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - README.md" -ForegroundColor White
Write-Host "  - IMPROVEMENTS_SUMMARY.md" -ForegroundColor White
Write-Host "  - CONTRIBUTING.md" -ForegroundColor White
Write-Host "  - SECURITY.md" -ForegroundColor White
Write-Host ""

Write-Host "Bon developpement!" -ForegroundColor Green
Write-Host ""
