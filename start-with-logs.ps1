# 🚀 MemoLib - Démarrage avec logs détaillés

Write-Host "🚀 DEMARRAGE MEMOLIB AVEC LOGS" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Vérifier .NET
try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET Version: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET non trouvé! Installez .NET 9.0" -ForegroundColor Red
    exit 1
}

# Vérifier le répertoire
if (!(Test-Path "Program.cs")) {
    Write-Host "❌ Fichier Program.cs non trouvé!" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le dossier MemoLib.Api" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Répertoire: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Restaurer les packages si nécessaire
if (!(Test-Path "bin")) {
    Write-Host "📦 Restauration des packages..." -ForegroundColor Yellow
    dotnet restore
}

# Compiler
Write-Host "🔨 Compilation..." -ForegroundColor Yellow
dotnet build --no-restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de compilation!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 LANCEMENT DE L'API AVEC LOGS DETAILLES" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs importantes:" -ForegroundColor Cyan
Write-Host "   🌐 Interface: http://localhost:5078/demo.html" -ForegroundColor White
Write-Host "   🔌 API:       http://localhost:5078/api" -ForegroundColor White
Write-Host "   ❤️  Santé:    http://localhost:5078/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

# Lancer avec logs détaillés
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:DOTNET_ENVIRONMENT = "Development"

dotnet run --no-build --verbosity normal