# ========================================
# SCRIPT 1: SAUVEGARDE COMPLETE DU PROJET
# ========================================
# Cree le: 13 decembre 2025
# Usage: .\scripts\1_backup_project.ps1
# ========================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  SAUVEGARDE DU PROJET IAPOSTEMANAGE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Users\moros\Desktop\iaPostemanage"
$BackupDir = "C:\Users\moros\Desktop\iaPostemanage_BACKUPS"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "iapostemanage_backup_$Timestamp"
$BackupPath = Join-Path $BackupDir $BackupName

# Creer le dossier de backups
if (-not (Test-Path $BackupDir)) {
    Write-Host "[1/5] Creation du dossier de backups..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "      [OK] Dossier cree" -ForegroundColor Green
} else {
    Write-Host "[1/5] Dossier de backups existant" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/5] Calcul de la taille du projet..." -ForegroundColor Yellow

# Calculer la taille
$SizeCalculation = Get-ChildItem -Path $ProjectRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules|\.git|__pycache__|\.pytest_cache|\.venv|venv" } | Measure-Object -Property Length -Sum

$SizeInMB = [math]::Round($SizeCalculation.Sum / 1MB, 2)
$FileCount = $SizeCalculation.Count

Write-Host "      Fichiers: $FileCount" -ForegroundColor Cyan
Write-Host "      Taille: $SizeInMB MB" -ForegroundColor Cyan
Write-Host ""

Write-Host "[3/5] Creation de la structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
Write-Host "      [OK]" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Copie des fichiers..." -ForegroundColor Yellow

# Liste des exclusions
$ExcludePatterns = @(
    "node_modules",
    ".git",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    "*.pyc",
    ".DS_Store",
    "Thumbs.db",
    "test-results",
    "playwright-report",
    "dist",
    "build"
)

# Copier
$CopiedCount = 0
$ErrorCount = 0

Get-ChildItem -Path $ProjectRoot -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $RelativePath = $_.FullName.Substring($ProjectRoot.Length)
    
    $ShouldExclude = $false
    foreach ($Pattern in $ExcludePatterns) {
        if ($RelativePath -like "*$Pattern*") {
            $ShouldExclude = $true
            break
        }
    }
    
    if (-not $ShouldExclude) {
        $DestPath = Join-Path $BackupPath $RelativePath
        
        try {
            if ($_.PSIsContainer) {
                if (-not (Test-Path $DestPath)) {
                    New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
                }
            } else {
                $DestDir = Split-Path $DestPath -Parent
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                Copy-Item -Path $_.FullName -Destination $DestPath -Force
                $CopiedCount++
                
                if ($CopiedCount % 100 -eq 0) {
                    Write-Host "      Progression: $CopiedCount fichiers..." -ForegroundColor Gray
                }
            }
        } catch {
            $ErrorCount++
        }
    }
}

Write-Host "      [OK] $CopiedCount fichiers copies" -ForegroundColor Green
if ($ErrorCount -gt 0) {
    Write-Host "      [!] $ErrorCount erreurs" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[5/5] Creation du fichier info..." -ForegroundColor Yellow

$ReadmeContent = @"
BACKUP DU PROJET IAPOSTEMANAGE
==============================

Date: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Backup: $BackupName

Statistiques:
- Fichiers: $CopiedCount
- Taille: $SizeInMB MB
- Erreurs: $ErrorCount

Exclusions: node_modules, .git, __pycache__, etc.

Pour restaurer:
1. Supprimer le projet actuel
2. Copier ce dossier vers: $ProjectRoot
3. npm install + pip install -r requirements.txt

IMPORTANT: Backup cree AVANT restructuration.
"@

$ReadmeContent | Out-File -FilePath (Join-Path $BackupPath "README_BACKUP.txt") -Encoding UTF8

Write-Host "      [OK]" -ForegroundColor Green
Write-Host ""

# Resume
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  [OK] SAUVEGARDE TERMINEE" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup: $BackupPath" -ForegroundColor Cyan
Write-Host "Fichiers: $CopiedCount ($SizeInMB MB)" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "Etape suivante:" -ForegroundColor Yellow
    Write-Host "  .\scripts\2_cleanup_project.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Appuyez sur une touche..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
