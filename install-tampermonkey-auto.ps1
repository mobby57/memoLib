# Installation automatique des scripts Tampermonkey
Write-Host "🚀 Installation des scripts Tampermonkey..." -ForegroundColor Cyan

$scriptDir = "$PSScriptRoot\tampermonkey"
$scripts = Get-ChildItem -Path $scriptDir -Filter "*.user.js"

Write-Host "`n📦 Scripts trouvés: $($scripts.Count)" -ForegroundColor Green

foreach ($script in $scripts) {
    Write-Host "`n✅ $($script.Name)" -ForegroundColor Yellow
    Write-Host "   Ouvrez ce fichier dans votre navigateur pour l'installer:" -ForegroundColor Gray
    Write-Host "   $($script.FullName)" -ForegroundColor White
}

Write-Host "`n📖 INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Assurez-vous que Tampermonkey est installé dans votre navigateur" -ForegroundColor White
Write-Host "2. Ouvrez chaque fichier .user.js dans votre navigateur" -ForegroundColor White
Write-Host "3. Tampermonkey détectera automatiquement le script" -ForegroundColor White
Write-Host "4. Cliquez sur 'Installer' dans la fenêtre Tampermonkey" -ForegroundColor White

Write-Host "`n🌐 Ou utilisez cette commande pour ouvrir le premier script:" -ForegroundColor Cyan
$firstScript = $scripts[0].FullName
Write-Host "   Start-Process '" -NoNewline -ForegroundColor Yellow
Write-Host $firstScript -NoNewline -ForegroundColor Yellow
Write-Host "'" -ForegroundColor Yellow

Write-Host "`n✨ Voulez-vous ouvrir le premier script maintenant? (O/N)" -ForegroundColor Green
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Start-Process $firstScript
    Write-Host "✅ Script ouvert! Installez-le dans Tampermonkey." -ForegroundColor Green
}

Write-Host "`n🎯 Une fois installés, rafraîchissez http://localhost:5078/demo.html" -ForegroundColor Cyan
