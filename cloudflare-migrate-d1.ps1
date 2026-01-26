# ============================================
# MIGRATION CLOUDFLARE D1
# SQLite -> Cloudflare D1 (Edge Database)
# ============================================

param(
    [switch]$Export,
    [switch]$Import,
    [switch]$Verify,
    [switch]$All
)

$ErrorActionPreference = "Stop"

$DB_NAME = "iaposte-production-db"
$DB_ID = "a86c51c6-2031-4ae6-941c-db4fc917826c"
$LOCAL_DB = "prisma/dev.db"
$EXPORT_FILE = "prisma/export.sql"
$BACKUP_DIR = "backups/d1-migration"

Write-Output ""
Write-Output "========================================"
Write-Output "  MIGRATION CLOUDFLARE D1"
Write-Output "========================================"
Write-Output ""

# ============================================
# 1. EXPORT BASE LOCALE
# ============================================
if ($Export -or $All) {
    Write-Output "[1] Export de la base de donnees locale"
    Write-Output "----------------------------------------"
    Write-Output ""
    
    if (-not (Test-Path $LOCAL_DB)) {
        Write-Output "[ERREUR] Base de donnees locale non trouvee: $LOCAL_DB"
        Write-Output "   Creez d'abord la base avec: npx prisma db push"
        exit 1
    }
    
    # Creer le dossier de backup
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    }
    
    # Backup de la base actuelle
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "$BACKUP_DIR/backup-$timestamp.db"
    
    Write-Output "[INFO] Backup de la base actuelle..."
    Copy-Item $LOCAL_DB $backupFile
    Write-Output "   [OK] Backup cree: $backupFile"
    
    # Export SQL
    Write-Output ""
    Write-Output "[INFO] Export SQL..."
    
    try {
        # Utiliser sqlite3 si disponible
        if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
            sqlite3 $LOCAL_DB .dump > $EXPORT_FILE
            Write-Output "   [OK] Export reussi: $EXPORT_FILE"
        } else {
            # Alternative: utiliser Prisma
            Write-Output "   [WARN] sqlite3 non trouve, utilisation de Prisma..."
            npx prisma db execute --file=$EXPORT_FILE --schema=prisma/schema.prisma
        }
        
        # Verifier la taille du fichier
        $fileSize = (Get-Item $EXPORT_FILE).Length / 1KB
        Write-Output "   [INFO] Taille de l'export: $([math]::Round($fileSize, 2)) KB"
        
    } catch {
        Write-Output "   [ERREUR] Erreur lors de l'export: $_"
        exit 1
    }
}

# ============================================
# 2. IMPORT VERS D1
# ============================================
if ($Import -or $All) {
    Write-Output ""
    Write-Output "[2] Import vers Cloudflare D1"
    Write-Output "----------------------------------------"
    Write-Output ""
    
    if (-not (Test-Path $EXPORT_FILE)) {
        Write-Output "[ERREUR] Fichier d'export non trouve: $EXPORT_FILE"
        Write-Output "   Executez d'abord avec -Export"
        exit 1
    }
    
    Write-Output "[INFO] Import en cours..."
    Write-Output "   Base: $DB_NAME"
    Write-Output "   ID: $DB_ID"
    Write-Output ""
    
    try {
        # Executer l'import
        wrangler d1 execute $DB_NAME --file=$EXPORT_FILE --remote
        
        Write-Output ""
        Write-Output "   [OK] Import termine!"
        
    } catch {
        Write-Output "   [ERREUR] Erreur lors de l'import: $_"
        
        # Conseil: split si fichier trop gros
        $fileSize = (Get-Item $EXPORT_FILE).Length / 1MB
        if ($fileSize -gt 1) {
            Write-Output ""
            Write-Output "[INFO] Le fichier fait $([math]::Round($fileSize, 2)) MB"
            Write-Output "   Essayez de le diviser en plus petits fichiers"
        }
        exit 1
    }
}

# ============================================
# 3. VERIFICATION
# ============================================
if ($Verify -or $All) {
    Write-Output ""
    Write-Output "[3] Verification de la base D1"
    Write-Output "----------------------------------------"
    Write-Output ""
    
    Write-Output "[INFO] Tables dans D1:"
    wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
    
    Write-Output ""
    Write-Output "[INFO] Nombre d'enregistrements par table:"
    
    $tables = @("User", "Client", "Dossier", "Document", "Message", "Invoice")
    foreach ($table in $tables) {
        try {
            Write-Output "   $table : $(wrangler d1 execute $DB_NAME --command="SELECT COUNT(*) FROM $table;" --remote 2>$null)"
        } catch {
            Write-Output "   $table : (table non trouvee)"
        }
    }
}

Write-Output ""
Write-Output "========================================"
Write-Output "  MIGRATION TERMINEE"
Write-Output "========================================"
Write-Output ""
Write-Output "Prochaines etapes:"
Write-Output "  1. Verifier les donnees: .\cloudflare-migrate-d1.ps1 -Verify"
Write-Output "  2. Configurer Prisma pour D1"
Write-Output "  3. Deployer l'application"
Write-Output ""
