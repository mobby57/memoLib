# NETTOYAGE FICHIERS MEMOLIB
# Garde uniquement les fichiers essentiels pour la commercialisation

Write-Host "NETTOYAGE FICHIERS MEMOLIB" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# FICHIERS .MD A GARDER (essentiels commerciaux)
$mdToKeep = @(
    "README.md",
    "FEATURES_COMPLETE.md",
    "IMPLEMENTATION_COMPLETE.md",
    "GUIDE_UTILISATEUR.md"
)

# FICHIERS .PS1 A GARDER (essentiels operationnels)
$ps1ToKeep = @(
    "go-validation.ps1",
    "restore-project.ps1",
    "backup-git.ps1"
)

# LISTER TOUS LES .MD
Write-Host "Fichiers .md trouves:" -ForegroundColor Yellow
$allMd = Get-ChildItem -Path . -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
$allMd | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

Write-Host "`nFichiers .md a garder:" -ForegroundColor Green
$mdToKeep | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }

# LISTER TOUS LES .PS1
Write-Host "`nFichiers .ps1 trouves:" -ForegroundColor Yellow
$allPs1 = Get-ChildItem -Path . -Filter "*.ps1" -File
$allPs1 | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

Write-Host "`nFichiers .ps1 a garder:" -ForegroundColor Green
$ps1ToKeep | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }

# CONFIRMATION
Write-Host "`nFichiers a supprimer:" -ForegroundColor Red
$mdToDelete = $allMd | Where-Object { $mdToKeep -notcontains $_.Name }
$ps1ToDelete = $allPs1 | Where-Object { $ps1ToKeep -notcontains $_.Name }

$mdToDelete | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Red }
$ps1ToDelete | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Red }

Write-Host "`nTotal a supprimer: $($mdToDelete.Count + $ps1ToDelete.Count) fichiers" -ForegroundColor Yellow

$confirm = Read-Host "`nConfirmer la suppression (o/n)"

if ($confirm -eq "o") {
    # Supprimer les .md
    foreach ($file in $mdToDelete) {
        Remove-Item $file.FullName -Force
        Write-Host "Supprime: $($file.Name)" -ForegroundColor Red
    }
    
    # Supprimer les .ps1
    foreach ($file in $ps1ToDelete) {
        Remove-Item $file.FullName -Force
        Write-Host "Supprime: $($file.Name)" -ForegroundColor Red
    }
    
    Write-Host "`nNettoyage termine!" -ForegroundColor Green
    Write-Host "Fichiers conserves:" -ForegroundColor Cyan
    Write-Host "  .md: $($mdToKeep.Count)" -ForegroundColor White
    Write-Host "  .ps1: $($ps1ToKeep.Count)" -ForegroundColor White
} else {
    Write-Host "`nNettoyage annule" -ForegroundColor Yellow
}

Write-Host "`nScript termine." -ForegroundColor Gray