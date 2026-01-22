# Setup Conda pour IA Poste Manager
# Version: 1.0
# Date: 19 janvier 2026

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION CONDA - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "   Installation environnement Python pour backend IA/ML" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# Vérifier Conda installé
Write-Host "`n[1/5] 🔍 Vérification installation Conda..." -ForegroundColor Yellow
try {
    $condaVersion = conda --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Conda installé: $condaVersion" -ForegroundColor Green
    } else {
        throw "Conda non trouvé"
    }
} catch {
    Write-Host "  ❌ Conda non installé!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  💡 Installation automatique de Miniconda..." -ForegroundColor Cyan
    
    $installerPath = "$env:TEMP\Miniconda3-Installer.exe"
    Write-Host "  📥 Téléchargement..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe" -OutFile $installerPath
    
    Write-Host "  📦 Installation en cours..." -ForegroundColor Yellow
    Start-Process -FilePath $installerPath -ArgumentList "/S", "/InstallationType=JustMe", "/AddToPath=1", "/RegisterPython=1" -Wait
    
    Write-Host "  ✅ Miniconda installé!" -ForegroundColor Green
    Write-Host "  ⚠️  Veuillez REDÉMARRER votre terminal et relancer ce script." -ForegroundColor Yellow
    pause
    exit 0
}

# Vérifier si environnement existe déjà
Write-Host "`n[2/5] 🔍 Vérification environnement existant..." -ForegroundColor Yellow
$envExists = conda env list | Select-String "iapostemanager"
if ($envExists) {
    Write-Host "  ⚠️  Environnement 'iapostemanager' existe déjà" -ForegroundColor Yellow
    $response = Read-Host "  Voulez-vous le recréer? (O/N)"
    if ($response -eq 'O' -or $response -eq 'o') {
        Write-Host "  🗑️  Suppression ancien environnement..." -ForegroundColor Yellow
        conda env remove -n iapostemanager -y
        Write-Host "  ✅ Ancien environnement supprimé" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️  Utilisation environnement existant" -ForegroundColor Cyan
        conda activate iapostemanager
        Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
        exit 0
    }
}

# Créer environnement depuis YAML
Write-Host "`n[3/5] 📦 Création environnement iapostemanager..." -ForegroundColor Yellow
Write-Host "  ⏱️  Durée estimée: 5-10 minutes" -ForegroundColor Cyan
Write-Host "  📥 Installation de 60+ packages..." -ForegroundColor Cyan

try {
    # Vérifier existence environment.yml
    if (-not (Test-Path "environment.yml")) {
        Write-Host "  ❌ Fichier environment.yml non trouvé!" -ForegroundColor Red
        Write-Host "  💡 Création depuis requirements-python.txt..." -ForegroundColor Yellow
        
        # Créer environnement minimal
        conda create -n iapostemanager python=3.11 -y
        
        # Activer et installer pip packages
        conda activate iapostemanager
        pip install -r requirements-python.txt
    } else {
        # Créer depuis YAML
        conda env create -f environment.yml
    }
    
    Write-Host "  ✅ Environnement créé avec succès!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Erreur création environnement: $_" -ForegroundColor Red
    Write-Host "  💡 Essai méthode alternative..." -ForegroundColor Yellow
    
    # Méthode alternative
    conda create -n iapostemanager python=3.11 -y
    conda activate iapostemanager
    pip install -r requirements-python.txt
}

# Installer modèle Spacy français
Write-Host "`n[4/5] 🇫🇷 Installation modèle NLP français (Spacy)..." -ForegroundColor Yellow
conda activate iapostemanager
try {
    python -m spacy download fr_core_news_sm
    Write-Host "  ✅ Modèle français installé!" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Modèle NLP optionnel - installation échouée" -ForegroundColor Yellow
}

# Vérifier installation
Write-Host "`n[5/5] ✅ Vérification installation..." -ForegroundColor Yellow

# Activer environnement
conda activate iapostemanager

# Test imports critiques
Write-Host "  🔍 Test imports Python..." -ForegroundColor Cyan
$testScript = @"
try:
    import fastapi
    print('  ✅ FastAPI OK')
    import numpy
    print('  ✅ NumPy OK')
    import flask
    print('  ✅ Flask OK')
    import uvicorn
    print('  ✅ Uvicorn OK')
    try:
        import ollama
        print('  ✅ Ollama OK')
    except:
        print('  ⚠️  Ollama client non installé (optionnel)')
    print('`n  🎉 Tous les imports critiques réussis!')
except Exception as e:
    print(f'  ❌ Erreur import: {e}')
    exit(1)
"@

python -c $testScript

Write-Host "`nInformations environnement:" -ForegroundColor Cyan
conda info iapostemanager

Write-Host "`n=============================================================" -ForegroundColor Green
Write-Host "   CONFIGURATION CONDA TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

Write-Host "`nProchaines etapes:" -ForegroundColor Yellow

Write-Host "`n1. Activer environnement:" -ForegroundColor Cyan
Write-Host "   conda activate iapostemanager" -ForegroundColor White

Write-Host "`n2. Lancer backend Python:" -ForegroundColor Cyan
Write-Host "   .\start-python-backend.ps1" -ForegroundColor White

Write-Host "`n3. Tester API:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n4. Developper:" -ForegroundColor Cyan
Write-Host "   code ." -ForegroundColor White

Write-Host "`nAide & Documentation:" -ForegroundColor Yellow
Write-Host "   - Voir CONDA_SETUP.md" -ForegroundColor Gray
Write-Host "   - conda --help" -ForegroundColor Gray
Write-Host "   - python --version" -ForegroundColor Gray

Write-Host "`nRessources:" -ForegroundColor Yellow
Write-Host "   - API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "   - Prisma Studio: npm run db:studio" -ForegroundColor Gray
Write-Host "   - Dashboard: npm run dev" -ForegroundColor Gray

# Proposer activation automatique
$activate = Read-Host "`nVoulez-vous activer l'environnement maintenant? (O/N)"
if ($activate -eq 'O' -or $activate -eq 'o') {
    Write-Host "`nActivation de l'environnement..." -ForegroundColor Green
    conda activate iapostemanager
    Write-Host "  Environnement active! Vous pouvez maintenant lancer le backend." -ForegroundColor Cyan
}

Write-Host "`nScript termine!" -ForegroundColor Magenta
