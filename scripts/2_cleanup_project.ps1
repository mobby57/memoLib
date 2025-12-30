# ========================================
# SCRIPT 2: NETTOYAGE INTELLIGENT DU PROJET
# ========================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  NETTOYAGE DU PROJET IAPOSTEMANAGE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\Users\moros\Desktop\iaPostemanage"

# Verifier backup
$BackupDir = "C:\Users\moros\Desktop\iaPostemanage_BACKUPS"
if (-not (Test-Path $BackupDir)) {
    Write-Host "[!] ERREUR: Aucun backup trouve!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Lancez d'abord: .\scripts\1_backup_project.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$LatestBackup = Get-ChildItem -Path $BackupDir -Directory | Sort-Object Name -Descending | Select-Object -First 1
Write-Host "[OK] Backup trouve: $($LatestBackup.Name)" -ForegroundColor Green
Write-Host ""

Write-Host "AVERTISSEMENT: Ce script va DEPLACER et SUPPRIMER des fichiers!" -ForegroundColor Yellow
Write-Host "Backup: $BackupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Continuer? (O/N): " -NoNewline -ForegroundColor Yellow
$Confirmation = Read-Host
if ($Confirmation -ne "O" -and $Confirmation -ne "o") {
    Write-Host "Annule." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 1: ARCHIVAGE FICHIERS OBSOLETES" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ArchiveRoot = Join-Path $ProjectRoot "archive"
$ArchiveTimestamp = Get-Date -Format "yyyyMMdd"

if (-not (Test-Path $ArchiveRoot)) {
    New-Item -ItemType Directory -Path $ArchiveRoot -Force | Out-Null
}

# Elements a archiver
$ToArchive = @{
    "frontend" = "v1_html_static"
    "frontend-unified" = "v2_unified_experimental"
    "frontend-pro" = "v3_pro_intermediate"
    "iapostemanager-pro" = "v4_pro_architecture"
    "backend" = "v1_modular_backend"
    "backend_minimal" = "v2_minimal_backend"
    "app_unified.py" = "app_unified_OLD.py"
    "app_OLD_DO_NOT_USE.py" = "app_OBSOLETE.py"
    "app_minimal_fixed.py" = "app_minimal_OLD.py"
    "docker-compose.unified.yml" = "docker-compose.unified_OLD.yml"
    "docker-compose.accessible.yml" = "docker-compose.accessible_ARCHIVE.yml"
    "microservices" = "v5_microservices_experimental"
}

$ArchivedCount = 0

Write-Host "[1/3] Archivage..." -ForegroundColor Yellow
Write-Host ""

foreach ($Item in $ToArchive.Keys) {
    $SourcePath = Join-Path $ProjectRoot $Item
    $ArchiveName = $ToArchive[$Item]
    $DestPath = Join-Path $ArchiveRoot "$ArchiveName`_$ArchiveTimestamp"
    
    if (Test-Path $SourcePath) {
        try {
            Write-Host "  Archivage: $Item" -ForegroundColor Gray
            Move-Item -Path $SourcePath -Destination $DestPath -Force
            $ArchivedCount++
            Write-Host "    [OK]" -ForegroundColor Green
        } catch {
            Write-Host "    [!] Erreur: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "  Resume: $ArchivedCount archives" -ForegroundColor Cyan
Write-Host ""

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 2: SUPPRESSION FICHIERS TEMP" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ToDelete = @(
    "*.pyc",
    "__pycache__",
    ".pytest_cache",
    "test-results",
    "playwright-report",
    ".DS_Store",
    "Thumbs.db",
    "*.log"
)

$DeletedCount = 0

Write-Host "[2/3] Suppression fichiers temporaires..." -ForegroundColor Yellow
Write-Host ""

foreach ($Pattern in $ToDelete) {
    try {
        $FilesToDelete = Get-ChildItem -Path $ProjectRoot -Filter $Pattern -Recurse -Force -ErrorAction SilentlyContinue
        
        foreach ($File in $FilesToDelete) {
            try {
                Remove-Item -Path $File.FullName -Recurse -Force -ErrorAction SilentlyContinue
                $DeletedCount++
            } catch {}
        }
    } catch {}
}

Write-Host "  Resume: $DeletedCount suppressions" -ForegroundColor Cyan
Write-Host ""

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PHASE 3: ORGANISATION DOCUMENTATION" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[3/3] Organisation docs..." -ForegroundColor Yellow

$DocsDir = Join-Path $ProjectRoot "docs"
if (-not (Test-Path $DocsDir)) {
    New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
}

# Categories
$DocCategories = @{
    "GUIDE_*.md" = "guides"
    "INSTALLATION*.md" = "setup"
    "DEMARRAGE*.md" = "setup"
    "CHANGELOG*.md" = "changelog"
    "ARCHITECTURE*.md" = "architecture"
    "PRODUCTION*.md" = "deployment"
    "DEPLOY*.md" = "deployment"
    "RAPPORT*.md" = "reports"
    "ANALYSE*.md" = "reports"
    "DEMO*.md" = "demos"
}

$MovedDocsCount = 0

foreach ($Pattern in $DocCategories.Keys) {
    $Category = $DocCategories[$Pattern]
    
    $CategoryPath = Join-Path $DocsDir $Category
    if (-not (Test-Path $CategoryPath)) {
        New-Item -ItemType Directory -Path $CategoryPath -Force | Out-Null
    }
    
    $MatchingFiles = Get-ChildItem -Path $ProjectRoot -Filter $Pattern -File -ErrorAction SilentlyContinue
    
    foreach ($File in $MatchingFiles) {
        $DestPath = Join-Path $DocsDir "$Category\$($File.Name)"
        
        if ($File.FullName -notlike "*\docs\*") {
            try {
                Move-Item -Path $File.FullName -Destination $DestPath -Force
                $MovedDocsCount++
            } catch {}
        }
    }
}

Write-Host ""
Write-Host "  Resume: $MovedDocsCount docs organisees" -ForegroundColor Cyan
Write-Host ""

# Index
$IndexContent = @"
# INDEX DE LA DOCUMENTATION

Genere: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## Structure

docs/
├── guides/          # Guides utilisation
├── setup/           # Installation
├── architecture/    # Doc technique
├── deployment/      # Production
├── reports/         # Rapports
├── changelog/       # Versions
└── demos/           # Demos
"@

$IndexContent | Out-File -FilePath (Join-Path $DocsDir "INDEX.md") -Encoding UTF8

Write-Host "  [OK] Index cree: docs/INDEX.md" -ForegroundColor Green
Write-Host ""

# Resume
Write-Host "===========================================" -ForegroundColor Green
Write-Host "  [OK] NETTOYAGE TERMINE" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "RESUME:" -ForegroundColor Cyan
Write-Host "  Archives:     $ArchivedCount" -ForegroundColor White
Write-Host "  Suppressions: $DeletedCount" -ForegroundColor White
Write-Host "  Docs:         $MovedDocsCount" -ForegroundColor White
Write-Host ""
Write-Host "Dossiers crees:" -ForegroundColor Cyan
Write-Host "  - archive/     (anciennes versions)" -ForegroundColor White
Write-Host "  - docs/        (documentation)" -ForegroundColor White
Write-Host ""
Write-Host "Etape suivante:" -ForegroundColor Yellow
Write-Host "  .\scripts\3_reorganize_structure.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
