# Migration Prisma avec Backup Automatique
# IA Poste Manager - Production Ready

Write-Host "MIGRATION PRISMA - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. BACKUP BASE DE DONNEES ACTUELLE
# ============================================

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
$dbFile = ".\prisma\dev.db"
$backupFile = "$backupDir\dev_backup_$timestamp.db"

Write-Host "[1/5] Backup base de donnees..." -ForegroundColor Yellow

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "      OK Dossier backups/ cree" -ForegroundColor Green
}

if (Test-Path $dbFile) {
    Copy-Item $dbFile $backupFile
    $backupSize = (Get-Item $backupFile).Length / 1KB
    $backupSizeRounded = [math]::Round($backupSize, 2)
    Write-Host "      OK Backup cree: $backupFile ($backupSizeRounded KB)" -ForegroundColor Green
} else {
    Write-Host "      INFO Pas de base existante (premiere migration)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 2. VERIFICATION SCHEMA PRISMA
# ============================================

Write-Host "[2/5] Verification schema Prisma..." -ForegroundColor Yellow

if (-not (Test-Path ".\prisma\schema.prisma")) {
    Write-Host "      ERROR Erreur: prisma/schema.prisma introuvable!" -ForegroundColor Red
    exit 1
}

$schemaContent = Get-Content ".\prisma\schema.prisma" -Raw

# Vérifier présence des nouveaux modèles
$requiredModels = @(
    "model Subscription",
    "model Invoice",
    "model UsageRecord",
    "model TenantUsageMetrics",
    "model QuotaEvent",
    "model AuditLogEntry",
    "model ConsentRecord",
    "model DataSubjectRequest"
)

$missingModels = @()
foreach ($model in $requiredModels) {
    if ($schemaContent -notmatch [regex]::Escape($model)) {
        $missingModels += $model
    }
}

if ($missingModels.Count -gt 0) {
    Write-Host "      WARNING Modeles manquants dans le schema:" -ForegroundColor Red
    foreach ($model in $missingModels) {
        Write-Host "         - $model" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "      INFO Le schema doit contenir les modeles de billing/quotas/RGPD" -ForegroundColor Yellow
    
    $continue = Read-Host "      Continuer quand meme? (y/N)"
    if ($continue -ne "y") {
        Write-Host "      Migration annulee." -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "      OK Tous les modeles requis sont presents" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 3. EXECUTION MIGRATION PRISMA
# ============================================

Write-Host "[3/5] Execution migration Prisma..." -ForegroundColor Yellow

$migrationName = "add_billing_quotas_rgpd_systems"

try {
    # Generer la migration
    Write-Host "      -> Generation de la migration..." -ForegroundColor Gray
    npx prisma migrate dev --name $migrationName --skip-generate 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      OK Migration creee: $migrationName" -ForegroundColor Green
    } else {
        Write-Host "      ERROR Erreur lors de la migration" -ForegroundColor Red
        
        # Proposer restauration backup
        if (Test-Path $backupFile) {
            Write-Host ""
            Write-Host "      BACKUP Backup disponible: $backupFile" -ForegroundColor Yellow
            $restore = Read-Host "      Restaurer le backup? (y/N)"
            
            if ($restore -eq "y") {
                Copy-Item $backupFile $dbFile -Force
                Write-Host "      OK Base restauree depuis le backup" -ForegroundColor Green
            }
        }
        
        exit 1
    }
    
    # Generer le client Prisma
    Write-Host "      -> Generation du client Prisma..." -ForegroundColor Gray
    npx prisma generate | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      OK Client Prisma genere" -ForegroundColor Green
    } else {
        Write-Host "      WARNING Erreur generation client (non bloquant)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "      ERROR Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 4. SEED DES PLANS TARIFAIRES
# ============================================

Write-Host "[4/5] Seed des plans tarifaires..." -ForegroundColor Yellow

if (Test-Path ".\prisma\seed-plans.ts") {
    try {
        npx tsx .\prisma\seed-plans.ts
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      OK Plans tarifaires crees (Solo, Cabinet, Enterprise)" -ForegroundColor Green
        } else {
            Write-Host "      WARNING Erreur seed (peut-etre deja existants)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      WARNING Seed non execute: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "      INFO Fichier seed-plans.ts introuvable (skip)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 5. VERIFICATION POST-MIGRATION
# ============================================

Write-Host "[5/5] Verification post-migration..." -ForegroundColor Yellow

# Verifier que la base est accessible
try {
    $dbSize = (Get-Item $dbFile).Length / 1KB
    $dbSizeRounded = [math]::Round($dbSize, 2)
    Write-Host "      OK Base de donnees accessible ($dbSizeRounded KB)" -ForegroundColor Green
    
    # Compter les tables (approximatif via schema)
    $tableCount = ([regex]::Matches($schemaContent, "model \w+")).Count
    Write-Host "      OK ~$tableCount modeles dans le schema" -ForegroundColor Green
    
} catch {
    Write-Host "      WARNING Verification base impossible: $_" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# RESUME FINAL
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OK MIGRATION TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "   1. Verifier les plans:    npx prisma studio" -ForegroundColor White
Write-Host "   2. Tester les quotas:     npx tsx scripts\test-billing.ts" -ForegroundColor White
Write-Host "   3. Lancer le serveur:     npm run dev`n" -ForegroundColor White

Write-Host "Backup sauvegarde dans: $backupFile" -ForegroundColor Gray
Write-Host ""
