# ============================================
# MIGRATION CLOUDFLARE D1
# SQLite → Cloudflare D1 (Edge Database)
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

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         MIGRATION CLOUDFLARE D1                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================
# 1️⃣ EXPORT BASE LOCALE
# ============================================
if ($Export -or $All) {
    Write-Host "1️⃣ Export de la base de données locale" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Gray
    
    if (-not (Test-Path $LOCAL_DB)) {
        Write-Host "❌ Base de données locale non trouvée: $LOCAL_DB" -ForegroundColor Red
        Write-Host "   Créez d'abord la base avec: npx prisma db push" -ForegroundColor Yellow
        exit 1
    }
    
    # Créer le dossier de backup
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    }
    
    # Backup de la base actuelle
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "$BACKUP_DIR/backup-$timestamp.db"
    
    Write-Host "📦 Backup de la base actuelle..." -ForegroundColor Cyan
    Copy-Item $LOCAL_DB $backupFile
    Write-Host "   ✅ Backup créé: $backupFile" -ForegroundColor Green
    
    # Export SQL
    Write-Host "`n💾 Export SQL..." -ForegroundColor Cyan
    
    try {
        # Utiliser sqlite3 si disponible
        if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
            sqlite3 $LOCAL_DB .dump > $EXPORT_FILE
            Write-Host "   ✅ Export réussi: $EXPORT_FILE" -ForegroundColor Green
        } else {
            # Alternative: utiliser Prisma
            Write-Host "   ⚠️  sqlite3 non trouvé, utilisation de Prisma..." -ForegroundColor Yellow
            npx prisma db execute --file=$EXPORT_FILE --schema=prisma/schema.prisma
        }
        
        # Vérifier la taille du fichier
        $fileSize = (Get-Item $EXPORT_FILE).Length / 1KB
        Write-Host "   📊 Taille de l'export: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
        
    } catch {
        Write-Host "   ❌ Erreur lors de l'export: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# 2️⃣ IMPORT VERS D1
# ============================================
if ($Import -or $All) {
    Write-Host "`n`n2️⃣ Import vers Cloudflare D1" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Gray
    
    if (-not (Test-Path $EXPORT_FILE)) {
        Write-Host "❌ Fichier d'export non trouvé: $EXPORT_FILE" -ForegroundColor Red
        Write-Host "   Exécutez d'abord: .\cloudflare-migrate-d1.ps1 -Export" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "📤 Import des données vers D1..." -ForegroundColor Cyan
    Write-Host "   Database: $DB_NAME" -ForegroundColor Gray
    Write-Host "   ID: $DB_ID" -ForegroundColor Gray
    
    try {
        # Import via Wrangler
        wrangler d1 execute $DB_NAME --file=$EXPORT_FILE
        
        Write-Host "`n   ✅ Import réussi vers Cloudflare D1!" -ForegroundColor Green
        
    } catch {
        Write-Host "   ❌ Erreur lors de l'import: $_" -ForegroundColor Red
        Write-Host "`n   💡 Solutions possibles:" -ForegroundColor Yellow
        Write-Host "      1. Vérifier que wrangler est connecté: wrangler whoami" -ForegroundColor Gray
        Write-Host "      2. Vérifier l'ID de la base dans wrangler.toml" -ForegroundColor Gray
        Write-Host "      3. Réessayer l'import" -ForegroundColor Gray
        exit 1
    }
}

# ============================================
# 3️⃣ VÉRIFICATION
# ============================================
if ($Verify -or $All) {
    Write-Host "`n`n3️⃣ Vérification de la migration" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Gray
    
    Write-Host "🔍 Vérification des tables..." -ForegroundColor Cyan
    
    try {
        # Lister les tables
        $tables = wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table';"
        
        Write-Host "   ✅ Tables trouvées:" -ForegroundColor Green
        Write-Host $tables
        
        # Compter les enregistrements
        Write-Host "`n   📊 Nombre d'enregistrements:" -ForegroundColor Cyan
        
        $tableNames = @("User", "Tenant", "Client", "Dossier", "Facture")
        
        foreach ($table in $tableNames) {
            try {
                $count = wrangler d1 execute $DB_NAME --command="SELECT COUNT(*) as count FROM $table;" 2>$null
                Write-Host "      $table : $count" -ForegroundColor White
            } catch {
                Write-Host "      $table : Non trouvée ou vide" -ForegroundColor Gray
            }
        }
        
    } catch {
        Write-Host "   ⚠️  Erreur lors de la vérification: $_" -ForegroundColor Yellow
    }
}

# ============================================
# 4️⃣ CONFIGURATION
# ============================================
Write-Host "`n`n4️⃣ Configuration de l'application" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Gray

Write-Host "⚙️  Configuration requise:" -ForegroundColor Cyan

Write-Host "`n   1. Mettre à jour wrangler.toml:" -ForegroundColor White
Write-Host "      [[d1_databases]]" -ForegroundColor Gray
Write-Host "      binding = `"DB`"" -ForegroundColor Gray
Write-Host "      database_name = `"$DB_NAME`"" -ForegroundColor Gray
Write-Host "      database_id = `"$DB_ID`"" -ForegroundColor Gray

Write-Host "`n   2. Mettre à jour DATABASE_URL (Cloudflare Pages):" -ForegroundColor White
Write-Host "      Via Dashboard ou CLI:" -ForegroundColor Gray
Write-Host "      wrangler pages secret put DATABASE_URL" -ForegroundColor Gray
Write-Host "      Valeur: Utiliser le binding D1 dans le code" -ForegroundColor Gray

Write-Host "`n   3. Adapter le code Prisma:" -ForegroundColor White
Write-Host "      // En production (Cloudflare)" -ForegroundColor Gray
Write-Host "      const db = env.DB; // Binding D1" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "      // En développement (local)" -ForegroundColor Gray
Write-Host "      const prisma = new PrismaClient();" -ForegroundColor Gray

# ============================================
# 5️⃣ RÉSUMÉ
# ============================================
Write-Host "`n`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              MIGRATION D1 TERMINÉE                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "✅ Étapes effectuées:" -ForegroundColor Cyan
if ($Export -or $All) { Write-Host "   ✅ Export base locale" -ForegroundColor Green }
if ($Import -or $All) { Write-Host "   ✅ Import vers D1" -ForegroundColor Green }
if ($Verify -or $All) { Write-Host "   ✅ Vérification" -ForegroundColor Green }

Write-Host "`n💾 Base D1:" -ForegroundColor Cyan
Write-Host "   Nom: $DB_NAME" -ForegroundColor White
Write-Host "   ID:  $DB_ID" -ForegroundColor White

Write-Host "`n📁 Fichiers créés:" -ForegroundColor Cyan
Write-Host "   Export SQL: $EXPORT_FILE" -ForegroundColor White
if (Test-Path $BACKUP_DIR) {
    Write-Host "   Backups:    $BACKUP_DIR" -ForegroundColor White
}

Write-Host "`n🚀 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Tester la base D1: wrangler d1 execute $DB_NAME --command=`"SELECT 1`"" -ForegroundColor Gray
Write-Host "   2. Configurer les variables d'environnement Cloudflare" -ForegroundColor Gray
Write-Host "   3. Déployer l'application: npm run pages:deploy" -ForegroundColor Gray
Write-Host "   4. Vérifier en production: .\test-production.ps1" -ForegroundColor Gray

Write-Host ""
