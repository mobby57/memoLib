# Installation simple de l'environnement Conda
# Utiliser APRES avoir installe Miniconda et execute 'conda init powershell'

Write-Host ""
Write-Host "=== CREATION ENVIRONNEMENT CONDA POUR IA POSTE MANAGER ===" -ForegroundColor Cyan
Write-Host ""

# Verifier que Conda est disponible
try {
    $null = Get-Command conda -ErrorAction Stop
    Write-Host "[OK] Conda detecte" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Conda non trouve!" -ForegroundColor Red
    Write-Host "Veuillez installer Miniconda puis executer: conda init powershell" -ForegroundColor Yellow
    exit 1
}

# Creer environnement depuis environment.yml
Write-Host ""
Write-Host "Creation de l'environnement 'memoLib'..." -ForegroundColor Yellow
Write-Host "Cela peut prendre 5-10 minutes..." -ForegroundColor Gray
Write-Host ""

if (Test-Path "environment.yml") {
    conda env create -f environment.yml
} else {
    Write-Host "[ERREUR] Fichier environment.yml non trouve!" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Environnement cree avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "  1. conda activate memoLib" -ForegroundColor White
    Write-Host "  2. .\start-python-backend.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERREUR] Echec de la creation de l'environnement" -ForegroundColor Red
    exit 1
}
