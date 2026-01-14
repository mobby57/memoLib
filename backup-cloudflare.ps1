#!/usr/bin/env pwsh
# Script de backup automatique Cloudflare
# IA Poste Manager

param(
    [string]$BackupDir = "backups/cloudflare",
    [switch]$IncludeR2
)

$date = Get-Date -Format "yyyyMMdd-HHmmss"
$dateShort = Get-Date -Format "yyyyMMdd"

Write-Host "💾 Backup Cloudflare - IA Poste Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📅 Date: $date" -ForegroundColor White

# Créer le dossier de backup
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    Write-Host "📁 Dossier de backup créé: $BackupDir" -ForegroundColor Green
}

# Variables
$DB_NAME = "iaposte-production-db"
$R2_BUCKET = "iaposte-documents"
$PROJECT_NAME = "iaposte-manager"

# 1. Backup D1 Database
Write-Host "`n1️⃣ Backup D1 Database..." -ForegroundColor Yellow

try {
    $d1File = "$BackupDir/d1-backup-$date.sql"
    wrangler d1 export $DB_NAME --output=$d1File --remote
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $d1File).Length / 1MB
        Write-Host "   ✅ D1 exporté: $d1File ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur export D1!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
}

# 2. Backup KV Namespaces (si utilisé)
Write-Host "`n2️⃣ Backup KV Namespaces..." -ForegroundColor Yellow

try {
    # Lister les namespaces
    $kvList = wrangler kv:namespace list 2>&1
    
    if ($kvList -match "SESSIONS" -or $kvList -match "CACHE") {
        $kvFile = "$BackupDir/kv-keys-$date.json"
        wrangler kv:key list --binding=SESSIONS 2>$null | Out-File -Encoding UTF8 $kvFile
        Write-Host "   ✅ KV keys listées: $kvFile" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  Pas de KV namespace configuré - skip" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ℹ️  KV non disponible - skip" -ForegroundColor Gray
}

# 3. Backup R2 Object List
Write-Host "`n3️⃣ Backup R2 Storage..." -ForegroundColor Yellow

if ($IncludeR2) {
    try {
        $r2File = "$BackupDir/r2-list-$date.json"
        wrangler r2 object list $R2_BUCKET 2>$null | Out-File -Encoding UTF8 $r2File
        
        if (Test-Path $r2File) {
            Write-Host "   ✅ R2 objects listés: $r2File" -ForegroundColor Green
            Write-Host "   ℹ️  Note: Seule la liste est sauvegardée, pas les fichiers" -ForegroundColor Gray
        } else {
            Write-Host "   ℹ️  R2 non configuré - skip" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ℹ️  R2 non disponible - skip" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  R2 skip (utiliser --IncludeR2 pour inclure)" -ForegroundColor Gray
}

# 4. Backup Configuration
Write-Host "`n4️⃣ Backup Configuration..." -ForegroundColor Yellow

try {
    $configFile = "$BackupDir/config-$date.json"
    
    $config = @{
        timestamp = $date
        project = $PROJECT_NAME
        database = $DB_NAME
        r2_bucket = $R2_BUCKET
        wrangler_version = (wrangler --version 2>&1)
        deployment_url = "https://$PROJECT_NAME.pages.dev"
    }
    
    $config | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 $configFile
    Write-Host "   ✅ Configuration sauvegardée: $configFile" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Erreur sauvegarde config: $_" -ForegroundColor Yellow
}

# 5. Nettoyage des vieux backups (> 30 jours)
Write-Host "`n5️⃣ Nettoyage des anciens backups..." -ForegroundColor Yellow

try {
    $oldBackups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Where-Object {
        $_.LastWriteTime -lt (Get-Date).AddDays(-30)
    }
    
    if ($oldBackups) {
        $count = $oldBackups.Count
        $oldBackups | Remove-Item -Force
        Write-Host "   🗑️  $count ancien(s) backup(s) supprimé(s)" -ForegroundColor Yellow
    } else {
        Write-Host "   ℹ️  Pas de vieux backups à supprimer" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Erreur nettoyage: $_" -ForegroundColor Yellow
}

# 6. Résumé
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Backup terminé!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

$backupFiles = Get-ChildItem -Path $BackupDir -Filter "*$dateShort*"
$totalSize = ($backupFiles | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "`n📊 Résumé:" -ForegroundColor Yellow
Write-Host "   📁 Dossier: $BackupDir" -ForegroundColor White
Write-Host "   📦 Fichiers: $($backupFiles.Count)" -ForegroundColor White
Write-Host "   💾 Taille totale: $([math]::Round($totalSize, 2)) MB" -ForegroundColor White

Write-Host "`n📝 Fichiers de backup:" -ForegroundColor Yellow
$backupFiles | ForEach-Object {
    Write-Host "   - $($_.Name)" -ForegroundColor Gray
}

Write-Host "`n💡 Conseil: Sauvegardez ces fichiers hors-site régulièrement!" -ForegroundColor Cyan
Write-Host "   Exemple: Copier vers OneDrive, Google Drive, ou S3" -ForegroundColor White

# Créer un script de restauration
$restoreScript = @"
#!/usr/bin/env pwsh
# Script de restauration généré automatiquement
# Date: $date

Write-Host "🔄 Restauration du backup $date" -ForegroundColor Cyan

# Restaurer D1
wrangler d1 execute $DB_NAME --file="$BackupDir/d1-backup-$date.sql" --remote

Write-Host "✅ Restauration terminée!" -ForegroundColor Green
"@

$restoreFile = "$BackupDir/restore-$date.ps1"
$restoreScript | Out-File -Encoding UTF8 $restoreFile
Write-Host "`n📝 Script de restauration créé: $restoreFile" -ForegroundColor Cyan
