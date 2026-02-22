# Sauvegarde complète du projet sur Git

Write-Host "=== Sauvegarde MemoLib sur Git ===" -ForegroundColor Cyan

# Initialiser git si nécessaire
if (-not (Test-Path ".git")) {
    Write-Host "Initialisation du dépôt Git..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Ajouter tous les fichiers
Write-Host "Ajout des fichiers..." -ForegroundColor Yellow
git add .

# Commit avec timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$message = "Sauvegarde complète - $timestamp - Toutes fonctionnalités implémentées"
Write-Host "Commit: $message" -ForegroundColor Yellow
git commit -m "$message"

# Afficher les instructions pour GitHub
Write-Host "`n=== Configuration GitHub ===" -ForegroundColor Green
Write-Host "1. Créez un nouveau dépôt sur GitHub: https://github.com/new" -ForegroundColor White
Write-Host "2. Nom suggéré: MemoLib" -ForegroundColor White
Write-Host "3. Exécutez ces commandes:" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/VOTRE_USERNAME/MemoLib.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== Sauvegarde locale terminée ===" -ForegroundColor Green
Write-Host "Pour pousser vers GitHub, suivez les instructions ci-dessus" -ForegroundColor Yellow
