# 🧹 NETTOYAGE ET MISE À JOUR DU PROJET

Write-Host "🚀 Nettoyage et mise à jour de MemoLib..." -ForegroundColor Cyan

# 1. Nettoyer les fichiers de build
Write-Host "`n📦 Nettoyage des fichiers de build..." -ForegroundColor Yellow
Remove-Item -Path "bin" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "obj" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Fichiers de build supprimés" -ForegroundColor Green

# 2. Restaurer les packages
Write-Host "`n📥 Restauration des packages NuGet..." -ForegroundColor Yellow
dotnet restore
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Packages restaurés" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la restauration" -ForegroundColor Red
    exit 1
}

# 3. Nettoyer la base de données (optionnel)
Write-Host "`n🗄️ Voulez-vous réinitialiser la base de données ? (O/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "O" -or $response -eq "o") {
    Remove-Item -Path "memolib.db" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "memolib.db-shm" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "memolib.db-wal" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Base de données supprimée" -ForegroundColor Green
}

# 4. Appliquer les migrations
Write-Host "`n🔄 Application des migrations..." -ForegroundColor Yellow
dotnet ef database update
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations appliquées" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors des migrations" -ForegroundColor Red
    exit 1
}

# 5. Compiler le projet
Write-Host "`n🔨 Compilation du projet..." -ForegroundColor Yellow
dotnet build --configuration Release
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilation réussie" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur de compilation" -ForegroundColor Red
    exit 1
}

# 6. Nettoyer les fichiers temporaires
Write-Host "`n🧹 Nettoyage des fichiers temporaires..." -ForegroundColor Yellow
Remove-Item -Path "*.log" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "wwwroot/*.map" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Fichiers temporaires supprimés" -ForegroundColor Green

# 7. Vérifier la configuration
Write-Host "`n⚙️ Vérification de la configuration..." -ForegroundColor Yellow
$secrets = dotnet user-secrets list 2>&1
if ($secrets -match "EmailMonitor:Password") {
    Write-Host "✅ Configuration email OK" -ForegroundColor Green
} else {
    Write-Host "⚠️ Configuration email manquante" -ForegroundColor Yellow
    Write-Host "Exécutez: dotnet user-secrets set 'EmailMonitor:Password' 'votre-mot-de-passe'" -ForegroundColor Cyan
}

# 8. Résumé
Write-Host "`n📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Build nettoyé" -ForegroundColor Green
Write-Host "✅ Packages restaurés" -ForegroundColor Green
Write-Host "✅ Migrations appliquées" -ForegroundColor Green
Write-Host "✅ Projet compilé" -ForegroundColor Green
Write-Host "✅ Fichiers temporaires supprimés" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n🚀 Projet prêt ! Lancez avec: dotnet run" -ForegroundColor Cyan
Write-Host "Interface: http://localhost:5078/demo.html" -ForegroundColor Cyan
