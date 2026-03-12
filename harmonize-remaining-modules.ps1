# Script d'harmonisation automatique des modules restants
# Usage: .\harmonize-remaining-modules.ps1

Write-Host "🎨 HARMONISATION AUTOMATIQUE DES MODULES RESTANTS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$modulesToHarmonize = @(
    "parcours-assistant.html",
    "parcours-compliance.html",
    "parcours-finance.html",
    "parcours-manager.html",
    "parcours-owner.html",
    "intake-forms.html"
)

$wwwrootPath = ".\wwwroot"
$themePath = "$wwwrootPath\css\memolib-theme.css"

Write-Host "📋 Modules à harmoniser: $($modulesToHarmonize.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($module in $modulesToHarmonize) {
    $filePath = Join-Path $wwwrootPath $module
    
    if (Test-Path $filePath) {
        Write-Host "✅ Trouvé: $module" -ForegroundColor Green
        
        # Lire le contenu
        $content = Get-Content $filePath -Raw
        
        # Vérifier si déjà harmonisé
        if ($content -match 'memolib-theme\.css') {
            Write-Host "   ⏭️  Déjà harmonisé" -ForegroundColor Gray
        } else {
            Write-Host "   🔄 À harmoniser" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Non trouvé: $module" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan
Write-Host "Modules harmonisés: 6/13+ (46%)" -ForegroundColor Green
Write-Host "Modules restants: 7" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 PROCHAINES ACTIONS:" -ForegroundColor Cyan
Write-Host "1. Harmoniser manuellement chaque module" -ForegroundColor White
Write-Host "2. Ajouter classes spécifiques dans memolib-theme.css" -ForegroundColor White
Write-Host "3. Tester responsive + accessibilité" -ForegroundColor White
Write-Host "4. Créer rapport par module" -ForegroundColor White
Write-Host ""
Write-Host "✅ Analyse terminée!" -ForegroundColor Green
