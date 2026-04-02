Write-Host "Test du parcours demo complet - MemoLib" -ForegroundColor Cyan
Write-Host ""

$pages = @(
    "src\app\[locale]\demo\email-simulator\page.tsx",
    "src\app\[locale]\demo\workspace-reasoning\page.tsx",
    "src\app\[locale]\demo\legal-proof\page.tsx"
)

Write-Host "Verification des fichiers..." -ForegroundColor Yellow
$allExist = $true
foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "  OK: $page" -ForegroundColor Green
    } else {
        Write-Host "  MANQUANT: $page" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""
if ($allExist) {
    Write-Host "Toutes les pages sont pretes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Demarrer le frontend:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Puis ouvrir:" -ForegroundColor Yellow
    Write-Host "  http://localhost:3000/demo/email-simulator" -ForegroundColor Cyan
} else {
    Write-Host "Certaines pages sont manquantes!" -ForegroundColor Red
    exit 1
}
