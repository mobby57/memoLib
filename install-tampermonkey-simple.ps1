# Installation automatique des scripts Tampermonkey
Write-Host "Installation des scripts Tampermonkey..." -ForegroundColor Cyan

$scriptDir = Join-Path $PSScriptRoot "tampermonkey"
$scripts = Get-ChildItem -Path $scriptDir -Filter "*.user.js"

Write-Host ""
Write-Host "Scripts trouves: $($scripts.Count)" -ForegroundColor Green
Write-Host ""

foreach ($script in $scripts) {
    Write-Host "- $($script.Name)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Ouvrez Tampermonkey dans votre navigateur" -ForegroundColor White
Write-Host "2. Cliquez sur Dashboard" -ForegroundColor White
Write-Host "3. Onglet Utilitaires" -ForegroundColor White
Write-Host "4. Glissez-deposez les fichiers .user.js depuis:" -ForegroundColor White
Write-Host "   $scriptDir" -ForegroundColor Gray
Write-Host ""

Write-Host "Voulez-vous ouvrir le dossier des scripts? (O/N)" -ForegroundColor Green
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Start-Process explorer.exe $scriptDir
    Write-Host "Dossier ouvert!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Une fois installes, rafraichissez http://localhost:5078/demo.html" -ForegroundColor Cyan
