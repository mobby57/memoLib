# Setup Conda pour IA Poste Manager
# Version: 1.0
# Date: 19 janvier 2026

$ErrorActionPreference = "Stop"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION CONDA - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "   Installation environnement Python pour backend IA/ML" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Conda installé
Write-Host "[1/5] Verification installation Conda..." -ForegroundColor Yellow
try {
    $null = Get-Command conda -ErrorAction Stop
    $condaVersion = conda --version 2>&1
    Write-Host "  OK Conda installe: $condaVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: Conda non installe!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Installation automatique de Miniconda..." -ForegroundColor Cyan
    
    $installerPath = "$env:TEMP\Miniconda3-Installer.exe"
    Write-Host "  Telechargement..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe" -OutFile $installerPath
    
    Write-Host "  Installation en cours..." -ForegroundColor Yellow
    Start-Process -FilePath $installerPath -ArgumentList "/S", "/InstallationType=JustMe", "/AddToPath=1", "/RegisterPython=1" -Wait
    
    Write-Host "  OK Miniconda installe!" -ForegroundColor Green
    Write-Host "  ATTENTION: Veuillez REDEMARRER votre terminal et relancer ce script." -ForegroundColor Yellow
    pause
    exit 0
}

# Vérifier si environnement existe déjà
Write-Host ""
Write-Host "[2/5] Verification environnement existant..." -ForegroundColor Yellow
$envList = conda env list 2>&1 | Out-String
if ($envList -match "memoLib") {
    Write-Host "  ATTENTION: Environnement 'memoLib' existe deja" -ForegroundColor Yellow
    $response = Read-Host "  Voulez-vous le recreer? (O/N)"
    if ($response -eq 'O' -or $response -eq 'o') {
        Write-Host "  Suppression ancien environnement..." -ForegroundColor Yellow
        conda env remove -n memoLib -y
        Write-Host "  OK Ancien environnement supprime" -ForegroundColor Green
    } else {
        Write-Host "  Utilisation environnement existant" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Configuration terminee!" -ForegroundColor Green
        exit 0
    }
}

# Créer environnement
Write-Host ""
Write-Host "[3/5] Creation environnement memoLib..." -ForegroundColor Yellow
Write-Host "  Duree estimee: 5-10 minutes" -ForegroundColor Cyan
Write-Host "  Installation de 60+ packages..." -ForegroundColor Cyan
Write-Host ""

try {
    # Vérifier existence environment.yml
    if (Test-Path "environment.yml") {
        Write-Host "  Utilisation fichier environment.yml..." -ForegroundColor Cyan
        conda env create -f environment.yml
    } elseif (Test-Path "requirements-python.txt") {
        Write-Host "  Utilisation fichier requirements-python.txt..." -ForegroundColor Cyan
        conda create -n memoLib python=3.11 -y
        conda run -n memoLib pip install -r requirements-python.txt
    } else {
        Write-Host "  ERREUR: Aucun fichier de configuration trouve!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  OK Environnement cree avec succes!" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR lors de la creation: $_" -ForegroundColor Red
    exit 1
}

# Installer modèle Spacy français
Write-Host ""
Write-Host "[4/5] Installation modele NLP francais (Spacy)..." -ForegroundColor Yellow
try {
    conda run -n memoLib python -m spacy download fr_core_news_sm
    Write-Host "  OK Modele francais installe!" -ForegroundColor Green
} catch {
    Write-Host "  ATTENTION: Modele NLP optionnel - installation echouee" -ForegroundColor Yellow
}

# Vérifier installation
Write-Host ""
Write-Host "[5/5] Verification installation..." -ForegroundColor Yellow

# Test imports critiques
Write-Host "  Test imports Python..." -ForegroundColor Cyan
$testScript = @"
try:
    import fastapi
    print('  OK FastAPI')
    import numpy
    print('  OK NumPy')
    import flask
    print('  OK Flask')
    import uvicorn
    print('  OK Uvicorn')
    try:
        import ollama
        print('  OK Ollama')
    except:
        print('  ATTENTION: Ollama client non installe (optionnel)')
    print('')
    print('  Tous les imports critiques reussis!')
except Exception as e:
    print(f'  ERREUR import: {e}')
    exit(1)
"@

conda run -n memoLib python -c $testScript

# Afficher informations
Write-Host ""
Write-Host "Informations environnement:" -ForegroundColor Cyan
conda info -e

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "   CONFIGURATION CONDA TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Activer environnement:" -ForegroundColor Cyan
Write-Host "   conda activate memoLib" -ForegroundColor White
Write-Host ""
Write-Host "2. Lancer backend Python:" -ForegroundColor Cyan
Write-Host "   .\start-python-backend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "3. Tester API:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "4. Developper:" -ForegroundColor Cyan
Write-Host "   code ." -ForegroundColor White
Write-Host ""

Write-Host "Aide et Documentation:" -ForegroundColor Yellow
Write-Host "   - Voir CONDA_SETUP.md" -ForegroundColor Gray
Write-Host "   - conda --help" -ForegroundColor Gray
Write-Host "   - python --version" -ForegroundColor Gray
Write-Host ""

Write-Host "Ressources:" -ForegroundColor Yellow
Write-Host "   - API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "   - Prisma Studio: npm run db:studio" -ForegroundColor Gray
Write-Host "   - Dashboard: npm run dev" -ForegroundColor Gray
Write-Host ""

# Proposer activation automatique
$activate = Read-Host "Voulez-vous activer l'environnement maintenant? (O/N)"
if ($activate -eq 'O' -or $activate -eq 'o') {
    Write-Host ""
    Write-Host "Activation de l'environnement..." -ForegroundColor Green
    Write-Host "Utilisez: conda activate memoLib" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Script termine!" -ForegroundColor Magenta
