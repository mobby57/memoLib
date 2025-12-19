#!/usr/bin/env pwsh
# ============================================================================
# DEPLOY TO RENDER.COM - AUTOMATIC DEPLOYMENT SCRIPT (PowerShell)
# ============================================================================

`$ErrorActionPreference = "Stop"
`$Host.UI.RawUI.WindowTitle = "Deploy to Render.com - iaPosteManager"

Write-Host "`n" -ForegroundColor Cyan
Write-Host "     RENDER.COM AUTOMATIC DEPLOYMENT - iaPosteManager          " -ForegroundColor Green
Write-Host "`n" -ForegroundColor Cyan

# Function to check command availability
function Test-Command {
    param([string]`$Command)
    `$null -ne (Get-Command `$Command -ErrorAction SilentlyContinue)
}

# STEP 1: Check Git availability
Write-Host "" -ForegroundColor Gray
Write-Host "[STEP 1/6] Verification de Git..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray

if (-not (Test-Command git)) {
    Write-Host " [ERROR] Git n'est pas installe!" -ForegroundColor Red
    Write-Host "Installez Git: https://git-scm.com/download/win" -ForegroundColor White
    pause
    exit 1
}
Write-Host " Git est disponible" -ForegroundColor Green

# STEP 2: Check Git repository
Write-Host "`n" -ForegroundColor Gray
Write-Host "[STEP 2/6] Verification du depot Git..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray

try {
    `$gitStatus = git status 2>&1
    if (`$LASTEXITCODE -ne 0) {
        throw "Not a git repository"
    }
    Write-Host " Depot Git valide" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Ce n'est pas un depot Git valide!" -ForegroundColor Red
    pause
    exit 1
}

# Check current branch
`$currentBranch = git branch --show-current
Write-Host "   Branche actuelle: `$currentBranch" -ForegroundColor Cyan

if (`$currentBranch -ne "main") {
    Write-Host "  [WARNING] Vous n'etes pas sur la branche 'main'" -ForegroundColor Yellow
    `$switch = Read-Host "Voulez-vous passer a la branche 'main'? (Y/N)"
    if (`$switch -eq "Y" -or `$switch -eq "y") {
        git checkout main
        if (`$LASTEXITCODE -ne 0) {
            Write-Host " [ERROR] Impossible de passer a la branche 'main'" -ForegroundColor Red
            pause
            exit 1
        }
        Write-Host " Branche 'main' active" -ForegroundColor Green
    } else {
        Write-Host "  Deploiement annule" -ForegroundColor Gray
        pause
        exit 0
    }
}

# STEP 3: Check required files
Write-Host "`n" -ForegroundColor Gray
Write-Host "[STEP 3/6] Verification des fichiers requis..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray

`$requiredFiles = @(
    "render.yaml",
    "requirements.txt",
    "build.sh",
    "start.sh"
)

`$missingFiles = @()
foreach (`$file in `$requiredFiles) {
    if (Test-Path `$file) {
        Write-Host "    `$file" -ForegroundColor Green
    } else {
        Write-Host "    `$file (MANQUANT!)" -ForegroundColor Red
        `$missingFiles += `$file
    }
}

if (`$missingFiles.Count -gt 0) {
    Write-Host "`n [ERROR] Fichiers manquants: `$(`$missingFiles -join ', ')" -ForegroundColor Red
    pause
    exit 1
}

# STEP 4: Add and commit changes
Write-Host "`n" -ForegroundColor Gray
Write-Host "[STEP 4/6] Commit des changements..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray

git add .

`$hasChanges = git diff-index --quiet HEAD
if (`$LASTEXITCODE -ne 0) {
    Write-Host "  Changements detectes" -ForegroundColor Cyan
    
    `$commitMsg = Read-Host "Message de commit [Auto-deploy to Render.com]"
    if ([string]::IsNullOrWhiteSpace(`$commitMsg)) {
        `$commitMsg = "Auto-deploy to Render.com"
    }
    
    git commit -m `$commitMsg
    if (`$LASTEXITCODE -ne 0) {
        Write-Host " [ERROR] Echec du commit!" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host " Commit cree avec succes" -ForegroundColor Green
    
    `$commitHash = git rev-parse --short HEAD
    Write-Host "   Commit: `$commitHash" -ForegroundColor Gray
} else {
    Write-Host "  Aucun changement a committer" -ForegroundColor Gray
}

# STEP 5: Push to GitHub
Write-Host "`n" -ForegroundColor Gray
Write-Host "[STEP 5/6] Push vers GitHub..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray

try {
    git push origin main 2>&1 | Out-Null
    if (`$LASTEXITCODE -ne 0) {
        throw "Git push failed"
    }
    Write-Host " Push vers GitHub reussi!" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Echec du push vers GitHub!" -ForegroundColor Red
    Write-Host "Verifiez vos credentials et votre connexion internet." -ForegroundColor Yellow
    pause
    exit 1
}

# STEP 6: Display deployment instructions
Write-Host "`n" -ForegroundColor Gray
Write-Host "[STEP 6/6] Instructions de deploiement..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Gray

Write-Host "`n" -ForegroundColor Cyan
Write-Host "          DEPLOIEMENT GITHUB REUSSI!                              " -ForegroundColor Green
Write-Host "`n" -ForegroundColor Cyan

Write-Host " Votre code est maintenant sur GitHub:" -ForegroundColor White
Write-Host "   https://github.com/mobby57/iapm.com" -ForegroundColor Cyan

Write-Host "`n" -ForegroundColor Cyan
Write-Host "         ETAPES POUR DEPLOYER SUR RENDER.COM                           " -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor Cyan

Write-Host "1  Ouvrir Render.com:" -ForegroundColor Yellow
Write-Host "   https://render.com`n" -ForegroundColor Cyan

Write-Host "2  Se connecter avec GitHub:" -ForegroundColor Yellow
Write-Host "    Cliquez sur 'Sign Up' ou 'Log In'" -ForegroundColor White
Write-Host "    Choisissez 'Continue with GitHub'" -ForegroundColor White
Write-Host "    Autorisez Render a acceder a vos repos`n" -ForegroundColor White

Write-Host "3  Creer un nouveau Blueprint:" -ForegroundColor Yellow
Write-Host "    Dans le Dashboard, cliquez sur 'New +'" -ForegroundColor White
Write-Host "    Selectionnez 'Blueprint'" -ForegroundColor White
Write-Host "    Choisissez le repo: mobby57/iapm.com" -ForegroundColor Cyan
Write-Host "    Render detectera automatiquement render.yaml`n" -ForegroundColor White

Write-Host "4  Appliquer le Blueprint:" -ForegroundColor Yellow
Write-Host "    Verifiez la configuration affichee" -ForegroundColor White
Write-Host "    Cliquez sur 'Apply'" -ForegroundColor Green
Write-Host "    Attendez 3-5 minutes pour le deploiement`n" -ForegroundColor White

Write-Host "5  Tester votre application:" -ForegroundColor Yellow
Write-Host "    URL: https://iapostemanager.onrender.com" -ForegroundColor Cyan
Write-Host "    Health check: https://iapostemanager.onrender.com/api/health`n" -ForegroundColor Cyan

Write-Host "" -ForegroundColor Cyan
Write-Host "          PRET POUR LE DEPLOIEMENT!                                  " -ForegroundColor Green
Write-Host "`n" -ForegroundColor Cyan

Write-Host "Ouvrez maintenant: " -NoNewline -ForegroundColor White
Write-Host "https://render.com" -ForegroundColor Cyan
Write-Host ""

`$openBrowser = Read-Host "Voulez-vous ouvrir Render.com dans le navigateur? (Y/N)"
if (`$openBrowser -eq "Y" -or `$openBrowser -eq "y") {
    Start-Process "https://render.com"
    Write-Host " Navigateur ouvert!" -ForegroundColor Green
}

Write-Host "`nAppuyez sur une touche pour quitter..." -ForegroundColor Gray
`$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
