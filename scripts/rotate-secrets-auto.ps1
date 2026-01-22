# Script de rotation automatique des secrets (sécurité)
param(
    [ValidateSet("database", "nextauth", "stripe", "github", "all")]
    [string]$SecretType = "all",
    
    [ValidateSet("local", "vercel", "cloudflare", "github", "all")]
    [string]$Target = "all"
)

Write-Host "`n" -ForegroundColor Green
Write-Host "       🔄 ROTATION AUTOMATIQUE DES SECRETS          " -ForegroundColor Green
Write-Host "" -ForegroundColor Green

Write-Host "⚠️  AVERTISSEMENT: Cette opération va générer de nouveaux secrets" -ForegroundColor Red
Write-Host "    - Assurez-vous d'avoir un backup!" -ForegroundColor Yellow
Write-Host "    - L'application ne fonctionnera plus avec les anciens secrets" -ForegroundColor Yellow
Write-Host "`n"

$confirm = Read-Host "Continuer la rotation? (oui/non)"
if ($confirm -ne "oui") {
    Write-Host "Opération annulée" -ForegroundColor Gray
    exit 0
}

# Créer le répertoire de backup
New-Item -ItemType Directory -Path "backups/rotated-secrets" -Force | Out-Null

function Generate-Secret($length = 32) {
    $chars = [char[]](33..126)
    return -join ($chars | Get-Random -Count $length)
}

function Rotate-Secret {
    param(
        [string]$SecretName,
        [string]$OldValue
    )
    
    Write-Host "`n🔄 Rotation: $SecretName" -ForegroundColor Cyan
    
    # Générer nouveau secret
    $newSecret = Generate-Secret 32
    
    # Sauvegarder ancien (backup)
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "backups/rotated-secrets/$timestamp-$SecretName.txt"
    Add-Content $backupFile "Old Secret (kept for 30 days for rollback):`n$OldValue`n`nRotation Date: $timestamp"
    Write-Host "  ✅ Backup: $backupFile" -ForegroundColor Green
    
    return $newSecret
}

# 1. Rotation LOCAL
if ($Target -in @("all", "local")) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "1️⃣  ROTATION LOCAL (.env.local)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    if (-not (Test-Path ".env.local")) {
        Write-Host "  ❌ .env.local not found" -ForegroundColor Red
    } else {
        $envVars = Get-Content ".env.local" | ConvertFrom-StringData
        $content = Get-Content ".env.local" -Raw
        
        if ($SecretType -in @("all", "nextauth")) {
            Write-Host "  → NEXTAUTH_SECRET" -ForegroundColor Gray
            $oldNextAuth = $envVars["NEXTAUTH_SECRET"]
            $newNextAuth = Rotate-Secret "NEXTAUTH_SECRET" $oldNextAuth
            $content = $content -replace "NEXTAUTH_SECRET=.*", "NEXTAUTH_SECRET=$newNextAuth"
            Write-Host "    ✅ Nouveau secret généré" -ForegroundColor Green
        }
        
        # Sauvegarder
        Set-Content ".env.local" $content
        Write-Host "  ✅ .env.local mis à jour" -ForegroundColor Green
    }
}

# 2. Rotation VAULT
if ($Target -in @("all", "vercel", "cloudflare")) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "2️⃣  ROTATION VAULT (.env.vault)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    if (-not (Test-Path ".env.vault")) {
        Write-Host "  ❌ .env.vault not found" -ForegroundColor Red
    } else {
        Write-Host "  → Synchronisation avec .env.local..." -ForegroundColor Gray
        npx dotenv-vault@latest push | Out-Null
        Write-Host "  ✅ Vault synchronisé et chiffré" -ForegroundColor Green
    }
}

# Résumé final
Write-Host "`n" -ForegroundColor Green
Write-Host "   ✅ ROTATION RÉUSSIE!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green

Write-Host "  📋 Résumé:" -ForegroundColor Cyan
Write-Host "    - Secrets roté: $SecretType" -ForegroundColor White
Write-Host "    - Cible(s): $Target" -ForegroundColor White
Write-Host "    - Backups: backups/rotated-secrets/" -ForegroundColor White

Write-Host "`n  ⚠️  ACTIONS SUIVANTES:" -ForegroundColor Yellow
Write-Host "    1. Redéployer l'application (Vercel)" -ForegroundColor White
Write-Host "    2. Tester les connexions" -ForegroundColor White
Write-Host "    3. Surveiller les logs d'erreur" -ForegroundColor White

Write-Host "`n  📅 Prochaine rotation recommandée:" -ForegroundColor Cyan
$nextRotation = (Get-Date).AddDays(90)
Write-Host "    $($nextRotation.ToString('dd MMMM yyyy'))" -ForegroundColor White

Write-Host "`n" -ForegroundColor Green
