# Installation automatique des scripts Tampermonkey pour MemoLib
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION SCRIPTS TAMPERMONKEY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les scripts existent
$scripts = @(
    "tampermonkey\1-demo-automation.user.js",
    "tampermonkey\2-gmail-integration.user.js",
    "tampermonkey\3-shortcuts.user.js",
    "tampermonkey\4-calendar-sync.user.js",
    "tampermonkey\5-ocr-helper.user.js",
    "tampermonkey\6-client-portal-ux.user.js"
)

Write-Host "Verification des scripts..." -ForegroundColor Yellow
$allExist = $true
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "  [OK] $script" -ForegroundColor Green
    } else {
        Write-Host "  [MANQUANT] $script" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host ""
    Write-Host "Erreur: Certains scripts sont manquants!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Tous les scripts sont presents!" -ForegroundColor Green
Write-Host ""

# Instructions d'installation
Write-Host "ETAPE 1: Installer Tampermonkey" -ForegroundColor Cyan
Write-Host "  Chrome/Edge: https://www.tampermonkey.net/" -ForegroundColor White
Write-Host "  Firefox: https://addons.mozilla.org/firefox/addon/tampermonkey/" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche une fois Tampermonkey installe..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "ETAPE 2: Installation des scripts" -ForegroundColor Cyan
Write-Host ""
Write-Host "Methode 1 - Automatique (recommande):" -ForegroundColor Yellow
Write-Host "  1. Ouvrez Tampermonkey Dashboard" -ForegroundColor White
Write-Host "  2. Cliquez sur l'onglet 'Utilities'" -ForegroundColor White
Write-Host "  3. Glissez-deposez tous les fichiers .user.js" -ForegroundColor White
Write-Host ""
Write-Host "Methode 2 - Manuelle:" -ForegroundColor Yellow
Write-Host "  1. Ouvrez Tampermonkey Dashboard" -ForegroundColor White
Write-Host "  2. Cliquez sur '+' (Create new script)" -ForegroundColor White
Write-Host "  3. Copiez-collez le contenu de chaque fichier" -ForegroundColor White
Write-Host ""

# Ouvrir le dossier des scripts
Write-Host "Ouverture du dossier des scripts..." -ForegroundColor Yellow
Start-Process "explorer.exe" -ArgumentList (Resolve-Path "tampermonkey")

Write-Host ""
Write-Host "Appuyez sur une touche une fois les scripts installes..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "ETAPE 3: Verification" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demarrage de MemoLib..." -ForegroundColor Yellow

# Ouvrir le navigateur
Start-Process "http://localhost:5078/demo.html"

Write-Host ""
Write-Host "Verifiez que vous voyez:" -ForegroundColor Yellow
Write-Host "  [1] Bouton 'Demo Automatique' (en haut a droite)" -ForegroundColor White
Write-Host "  [2] Icone clavier (en bas a droite)" -ForegroundColor White
Write-Host "  [3] Bouton 'Sync Calendar' (en bas a droite)" -ForegroundColor White
Write-Host "  [4] Zone OCR (en bas a droite)" -ForegroundColor White
Write-Host "  [5] Icone UX (en bas a droite)" -ForegroundColor White
Write-Host ""
Write-Host "Si vous ne voyez rien:" -ForegroundColor Red
Write-Host "  1. Verifiez que Tampermonkey est installe et active" -ForegroundColor White
Write-Host "  2. Verifiez que les scripts sont actives dans le Dashboard" -ForegroundColor White
Write-Host "  3. Rafraichissez la page (F5)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scripts installes: 6/6" -ForegroundColor Green
Write-Host "Documentation: tampermonkey\README.md" -ForegroundColor White
Write-Host ""
Write-Host "Raccourcis clavier:" -ForegroundColor Yellow
Write-Host "  ? = Aide" -ForegroundColor White
Write-Host "  Ctrl+N = Nouveau dossier" -ForegroundColor White
Write-Host "  Ctrl+F = Recherche" -ForegroundColor White
Write-Host "  Ctrl+S = Sauvegarder" -ForegroundColor White
Write-Host ""
