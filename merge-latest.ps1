```powershell
# merge-latest.ps1
# Recherche les fichiers en double par nom + extension
# et conserve la copie la plus récente.
#
# IMPORTANT :
# - Le script fonctionne en MODE DRY-RUN par défaut.
# - Il ne supprime rien tant que -Apply n'est pas utilisé.
# - Il crée une sauvegarde avant toute suppression.

param(
    [switch]$Apply
)

$Root = (Get-Location).Path
$BackupRoot = Join-Path $Root ("backup-merge-" + (Get-Date -Format "yyyyMMdd_HHmmss"))

# Dossiers à ignorer
$ExcludedDirs = @(
    "node_modules",
    ".next",
    ".git",
    "bin",
    "obj",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".cache"
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "       MEMOLIB - MERGE FICHIERS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($Apply) {
    Write-Host "MODE : APPLICATION REELLE" -ForegroundColor Yellow
    Write-Host "Une sauvegarde sera créée dans :" -ForegroundColor Yellow
    Write-Host $BackupRoot -ForegroundColor Yellow
}
else {
    Write-Host "MODE : DRY-RUN" -ForegroundColor Green
    Write-Host "Aucun fichier ne sera supprimé." -ForegroundColor Green
    Write-Host "Pour appliquer : .\merge-latest.ps1 -Apply" -ForegroundColor Green
}

Write-Host ""

# ------------------------------------------------------------
# Recherche des fichiers
# ------------------------------------------------------------

$Files = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $relative = $_.FullName.Substring($Root.Length).TrimStart('\')
        $parts = $relative -split '\\'

        # Ignore les dossiers techniques
        -not ($parts | Where-Object { $ExcludedDirs -contains $_ })
    }

Write-Host "Fichiers analysés : $($Files.Count)" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# Groupement par nom + extension
# ------------------------------------------------------------

$Groups = $Files |
    Group-Object {
        $_.Name.ToLowerInvariant()
    } |
    Where-Object {
        $_.Count -gt 1
    }

if ($Groups.Count -eq 0) {
    Write-Host "Aucun doublon détecté." -ForegroundColor Green
    exit 0
}

Write-Host "Groupes de doublons détectés : $($Groups.Count)" -ForegroundColor Yellow
Write-Host ""

$DeletedCount = 0
$KeptCount = 0

# ------------------------------------------------------------
# Traitement
# ------------------------------------------------------------

foreach ($Group in $Groups) {

    Write-Host "-----------------------------------------" -ForegroundColor DarkGray
    Write-Host "Fichier : $($Group.Name)" -ForegroundColor White

    $Sorted = $Group.Group |
        Sort-Object LastWriteTime -Descending

    $Newest = $Sorted[0]

    Write-Host ""
    Write-Host "  VERSION CONSERVÉE :" -ForegroundColor Green
    Write-Host "  $($Newest.FullName)" -ForegroundColor Green
    Write-Host "  Modifié : $($Newest.LastWriteTime)" -ForegroundColor Green

    $Duplicates = $Sorted | Select-Object -Skip 1

    foreach ($Old in $Duplicates) {

        Write-Host ""
        Write-Host "  VERSION PLUS ANCIENNE :" -ForegroundColor Yellow
        Write-Host "  $($Old.FullName)" -ForegroundColor Yellow
        Write-Host "  Modifié : $($Old.LastWriteTime)" -ForegroundColor Yellow

        if ($Apply) {

            # Créer le dossier de sauvegarde en conservant
            # l'arborescence originale
            $RelativePath = $Old.FullName.Substring($Root.Length).TrimStart('\')
            $BackupPath = Join-Path $BackupRoot $RelativePath
            $BackupDir = Split-Path $BackupPath -Parent

            New-Item -ItemType Directory -Path $BackupDir -Force |
                Out-Null

            Copy-Item $Old.FullName $BackupPath -Force

            Write-Host "  Sauvegarde : $BackupPath" -ForegroundColor DarkCyan

            Remove-Item $Old.FullName -Force

            Write-Host "  SUPPRIMÉ" -ForegroundColor Red

            $DeletedCount++
        }
        else {
            Write-Host "  [DRY-RUN] serait supprimé" -ForegroundColor DarkYellow
        }
    }

    $KeptCount++
}

# ------------------------------------------------------------
# Résumé
# ------------------------------------------------------------

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "                 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Groupes analysés : $($Groups.Count)"
Write-Host "Versions conservées : $KeptCount"

if ($Apply) {
    Write-Host "Fichiers supprimés : $DeletedCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Sauvegarde disponible ici :" -ForegroundColor Green
    Write-Host $BackupRoot -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "AUCUNE MODIFICATION EFFECTUÉE." -ForegroundColor Green
    Write-Host ""
    Write-Host "Si le résultat te convient :" -ForegroundColor Yellow
    Write-Host ".\merge-latest.ps1 -Apply" -ForegroundColor Yellow
}

Write-Host ""
```
