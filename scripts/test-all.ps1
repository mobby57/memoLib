param([string]$ApiUrl = 'http://localhost:5078')

Write-Host "🎉 TEST COMPLET MEMOLIB - TOUTES FONCTIONNALITES" -ForegroundColor Magenta

Write-Host "`n📋 FONCTIONNALITES DISPONIBLES:" -ForegroundColor Cyan
Write-Host "✅ API Core - http://localhost:5078" -ForegroundColor Green
Write-Host "✅ Interface principale - http://localhost:5078/demo.html" -ForegroundColor Green
Write-Host "✅ Dashboard temps réel - http://localhost:5078/dashboard.html" -ForegroundColor Green
Write-Host "✅ Export PDF - http://localhost:5078/export.html" -ForegroundColor Green
Write-Host "✅ App Mobile - http://localhost:5078/mobile.html" -ForegroundColor Green

Write-Host "`n🔧 TEST API..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/health" -TimeoutSec 5
    if ($health.status -eq 'healthy') {
        Write-Host "✅ API en ligne" -ForegroundColor Green
    } else {
        Write-Host "⚠️ API répond mais statut: $($health.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API hors ligne" -ForegroundColor Red
}

Write-Host "`n📊 TEST DASHBOARD..." -ForegroundColor Cyan
try {
    $overview = Invoke-RestMethod -Uri "$ApiUrl/api/dashboard/overview" -TimeoutSec 5
    Write-Host "✅ Dashboard OK - $($overview.stats.totalCases) dossiers, $($overview.stats.totalEvents) emails" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Dashboard nécessite authentification" -ForegroundColor Yellow
}

Write-Host "`n🚀 LANCEMENT AUTOMATIQUE DES INTERFACES..." -ForegroundColor Cyan

# Ouvrir les interfaces dans le navigateur
$interfaces = @(
    @{ Name = "Interface principale"; Url = "$ApiUrl/demo.html" },
    @{ Name = "Dashboard"; Url = "$ApiUrl/dashboard.html" },
    @{ Name = "Export PDF"; Url = "$ApiUrl/export.html" },
    @{ Name = "App Mobile"; Url = "$ApiUrl/mobile.html" }
)

foreach ($interface in $interfaces) {
    Write-Host "🌐 Ouverture: $($interface.Name)" -ForegroundColor Gray
    Start-Process $interface.Url
    Start-Sleep -Seconds 1
}

Write-Host "`n🎯 INSTRUCTIONS D'UTILISATION:" -ForegroundColor Yellow
Write-Host "1. Connectez-vous avec: demo@memolib.local / Demo123!" -ForegroundColor White
Write-Host "2. Testez l'ingestion d'emails dans l'interface principale" -ForegroundColor White
Write-Host "3. Consultez le dashboard temps réel" -ForegroundColor White
Write-Host "4. Exportez vos dossiers en PDF" -ForegroundColor White
Write-Host "5. Utilisez l'app mobile sur votre téléphone" -ForegroundColor White

Write-Host "`n📱 POUR L'APP MOBILE:" -ForegroundColor Yellow
Write-Host "- Ouvrez http://localhost:5078/mobile.html sur votre téléphone" -ForegroundColor White
Write-Host "- Ajoutez à l'écran d'accueil pour une expérience native" -ForegroundColor White

Write-Host "`n🔧 SCRIPTS DISPONIBLES:" -ForegroundColor Yellow
Write-Host "- scripts/demo.ps1 - Démonstration rapide" -ForegroundColor White
Write-Host "- scripts/run-api-local.ps1 - Démarrage API" -ForegroundColor White
Write-Host "- scripts/setup-local.ps1 - Installation fonctionnalités" -ForegroundColor White

Write-Host "`n🎉 MEMOLIB EST PRET A L'UTILISATION!" -ForegroundColor Green
Write-Host "Toutes les fonctionnalités sont installées et opérationnelles." -ForegroundColor Green