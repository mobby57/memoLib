# Test du Parcours Démo Complet - MemoLib

Write-Host "🚀 Test du parcours démo en 3 étapes" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les pages existent
$pages = @(
    "src\app\[locale]\demo\email-simulator\page.tsx",
    "src\app\[locale]\demo\workspace-reasoning\page.tsx",
    "src\app\[locale]\demo\legal-proof\page.tsx"
)

Write-Host "✅ Vérification des fichiers..." -ForegroundColor Yellow
foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "  ✓ $page" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $page MANQUANT" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Parcours de démonstration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1️⃣  Email Simulator" -ForegroundColor White
Write-Host "      → Simuler un email client OQTF" -ForegroundColor Gray
Write-Host "      → URL: http://localhost:3000/demo/email-simulator" -ForegroundColor Blue
Write-Host ""
Write-Host "  2️⃣  Workspace Reasoning" -ForegroundColor White
Write-Host "      → Analyse IA du dossier" -ForegroundColor Gray
Write-Host "      → Détection risques + actions prioritaires" -ForegroundColor Gray
Write-Host "      → URL: http://localhost:3000/demo/workspace-reasoning" -ForegroundColor Blue
Write-Host ""
Write-Host "  3️⃣  Legal Proof" -ForegroundColor White
Write-Host "      → Génération preuve opposable" -ForegroundColor Gray
Write-Host "      → Hash SHA-256 + signatures + audit trail" -ForegroundColor Gray
Write-Host "      → URL: http://localhost:3000/demo/legal-proof" -ForegroundColor Blue
Write-Host ""

Write-Host "🎯 Prochaines étapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Démarrer le frontend Next.js:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Ouvrir le navigateur:" -ForegroundColor White
Write-Host "     http://localhost:3000/demo/email-simulator" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Suivre le parcours complet (3 étapes)" -ForegroundColor White
Write-Host ""

Write-Host "✅ Toutes les pages sont prêtes!" -ForegroundColor Green
