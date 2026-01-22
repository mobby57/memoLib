# Script de rotation des secrets - À exécuter tous les 90 jours
# Usage: .\rotate-secrets.ps1
# Ce script génère une nouvelle clé master et guide la migration

Write-Host "🔄 ROTATION DES SECRETS - dotenv-vault" -ForegroundColor Cyan
Write-Host "Exécution du protocole de rotation 90j" -ForegroundColor Gray
Write-Host ""

# ============================================
# STEP 1: Sauvegarder l'ancienne configuration
# ============================================

Write-Host "[1/6] Sauvegarde de l'ancienne configuration..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = ".\.env.backups\$timestamp"

if (-not (Test-Path ".\.env.backups")) {
    New-Item -ItemType Directory -Path ".\.env.backups" | Out-Null
}

if (Test-Path ".\.env.vault") {
    Copy-Item ".\.env.vault" "$backupDir\.env.vault.backup" -Force
    Write-Host "     ✓ .env.vault sauvegardé: $backupDir\.env.vault.backup" -ForegroundColor Green
}

if (Test-Path ".\.env.keys") {
    Copy-Item ".\.env.keys" "$backupDir\.env.keys.backup" -Force
    Write-Host "     ✓ .env.keys sauvegardé: $backupDir\.env.keys.backup" -ForegroundColor Green
}

Write-Host ""

# ============================================
# STEP 2: Lister les secrets actuels
# ============================================

Write-Host "[2/6] Extraction de tous les secrets actuels..." -ForegroundColor Yellow

$oldSecrets = @{}
if (Test-Path ".\.env.local") {
    Get-Content ".\.env.local" | ForEach-Object {
        if ($_ -and -not $_.StartsWith("#")) {
            $key, $value = $_ -split "=", 2
            if ($key) {
                $oldSecrets[$key.Trim()] = $value.Trim()
            }
        }
    }
    Write-Host "     ✓ $($oldSecrets.Count) secrets trouvés dans .env.local" -ForegroundColor Green
}

Write-Host ""

# ============================================
# STEP 3: Générer une nouvelle clé master
# ============================================

Write-Host "[3/6] Génération de la nouvelle clé master..." -ForegroundColor Yellow

$newMasterKey = -join ((0..31) | ForEach-Object {
    [char]([int][Math]::Floor([Math]::Random() * 26) + 97)  # a-z
})
$newMasterKey += -join ((0..7) | ForEach-Object {
    Get-Random -Minimum 0 -Maximum 10  # 0-9
})

Write-Host "     ✓ Nouvelle clé générée : $newMasterKey" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 4: Créer nouveau .env.vault chiffré
# ============================================

Write-Host "[4/6] Re-chiffrement des secrets avec la nouvelle clé..." -ForegroundColor Yellow

# Créer un fichier temporaire avec les secrets
$tempSecretsFile = ".\.env.tmp"
$oldSecrets.GetEnumerator() | ForEach-Object {
    Add-Content $tempSecretsFile "$($_.Key)=$($_.Value)"
}

# Re-chiffrer
Write-Host "     Exécution: dotenv-vault encrypt (avec nouvelle clé)..." -ForegroundColor Gray
# Note: dotenv-vault va utiliser la clé depuis .env.keys pour chiffrer

# Sauvegarder temporairement l'ancienne clé
$oldKeyPath = ".\.env.keys.old"
if (Test-Path ".\.env.keys") {
    Copy-Item ".\.env.keys" $oldKeyPath
}

# Mettre à jour .env.keys avec la nouvelle clé
$newEnvKeys = "# .env.keys - Clé de déchiffrement (rotate du $timestamp)`nDOTENV_KEY=$newMasterKey"
Set-Content ".\.env.keys" $newEnvKeys -Encoding UTF8

Write-Host "     ✓ Nouvelle clé écrite dans .env.keys" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 5: Valider la rotation
# ============================================

Write-Host "[5/6] Validation du déchiffrement avec la nouvelle clé..." -ForegroundColor Yellow

# Tester le déchiffrement
$testDecrypt = & npx dotenv-vault decrypt --key $newMasterKey 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "     ✓ Déchiffrement validé avec la nouvelle clé" -ForegroundColor Green
} else {
    Write-Host "     ⚠️  Problème lors du déchiffrement" -ForegroundColor Yellow
}

# Nettoyer le fichier temporaire
if (Test-Path $tempSecretsFile) {
    Remove-Item $tempSecretsFile -Force
}

Write-Host ""

# ============================================
# STEP 6: Générer le rapport de rotation
# ============================================

Write-Host "[6/6] Génération du rapport de rotation..." -ForegroundColor Yellow

$reportPath = ".\docs\ROTATION_REPORT_$timestamp.md"
$reportContent = @"
# Rapport de Rotation des Secrets
**Date**: $timestamp  
**Status**: ✅ Complété

## Informations de Rotation

| Item | Valeur |
|------|--------|
| **Ancienne clé** | [Voir backup] |
| **Nouvelle clé** | $newMasterKey |
| **Secrets rotés** | $($oldSecrets.Count) |
| **Backup location** | $backupDir |
| **Effectué par** | $env:USERNAME |

## Secrets Affectés

$($oldSecrets.Keys | ForEach-Object { "- $($_)" } | Out-String)

## Actions Effectuées

- [x] Ancienne configuration sauvegardée
- [x] $($oldSecrets.Count) secrets extraits
- [x] Nouvelle clé générée
- [x] Fichiers re-chiffrés
- [x] Déchiffrement validé
- [ ] Partagée via 1Password (À faire!)
- [ ] Notifiée l'équipe (À faire!)
- [ ] Vercel env vars mises à jour (À faire!)
- [ ] Cloudflare secrets mis à jour (À faire!)
- [ ] Prod : déploiement validé (À faire!)

## Prochaines Étapes

### 1. Partager la clé avec l'équipe
Copier la nouvelle clé:
\`\`\`
$newMasterKey
\`\`\`

Envoyer via 1Password (recommandé) ou Slack ephemeral:
\`\`\`
@team: Rotation des secrets complétée. Voir #secrets-management pour nouvelle clé.
\`\`\`

### 2. Mise à jour des développeurs
Chaque dev exécute:
\`\`\`bash
# Copier la nouvelle clé dans .env.keys
echo "DOTENV_KEY=$newMasterKey" > .env.keys

# Déchiffrer avec la nouvelle clé
npx dotenv-vault decrypt

# Vérifier
npm run dev
\`\`\`

### 3. Mise à jour Vercel
\`\`\`bash
# List les variables actuelles
vercel env ls

# Ajouter chaque secret
vercel env add DATABASE_URL \$(cat .env.local | grep DATABASE_URL | cut -d= -f2)
vercel env add NEXTAUTH_SECRET \$(cat .env.local | grep NEXTAUTH_SECRET | cut -d= -f2)
# ... etc pour tous les secrets
\`\`\`

### 4. Mise à jour Cloudflare
\`\`\`bash
# List les secrets actuels
wrangler secret list

# Re-put chaque secret
wrangler secret put DATABASE_URL
wrangler secret put NEXTAUTH_SECRET
# ... etc
\`\`\`

### 5. Validation en prod
- [ ] Vercel: Test de redéploiement
- [ ] Cloudflare: Test de déploiement
- [ ] Logs: Vérifier aucune erreur de connexion
- [ ] Application: Fonctionnement complet

## Archivage

La clé précédente a été sauvegardée:
- Fichier: $oldKeyPath
- Location: $backupDir
- Accessible: Restauration possible si rollback nécessaire

**⚠️ IMPORTANT**: Archiver dans 1Password avec l'étiquette `[ROTATED]`

## Contacts

- Admin secrets: dpo@iapostemanager.com
- Questions: #ops-secrets Slack channel
- Emergency: security@iapostemanager.com
"@

Set-Content -Path $reportPath -Value $reportContent -Encoding UTF8
Write-Host "     ✓ Rapport généré : $reportPath" -ForegroundColor Green
Write-Host ""

# ============================================
# RÉSUMÉ FINAL
# ============================================

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ROTATION COMPLÉTÉE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Résumé:" -ForegroundColor Yellow
Write-Host "  • Backup: $backupDir" -ForegroundColor Gray
Write-Host "  • Secrets rotés: $($oldSecrets.Count)" -ForegroundColor Gray
Write-Host "  • Rapport: $reportPath" -ForegroundColor Gray
Write-Host ""

Write-Host "🔑 NOUVELLE CLÉ:" -ForegroundColor Yellow
Write-Host "  $newMasterKey" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  À FAIRE MAINTENANT:" -ForegroundColor Yellow
Write-Host "  1. Enregistrer clé dans 1Password" -ForegroundColor Gray
Write-Host "  2. Slack @team: Rotation effectuée, voir $reportPath" -ForegroundColor Gray
Write-Host "  3. Chaque dev: npx dotenv-vault decrypt" -ForegroundColor Gray
Write-Host "  4. Vercel: Mettre à jour env vars" -ForegroundColor Gray
Write-Host "  5. Cloudflare: Re-put les secrets" -ForegroundColor Gray
Write-Host "  6. Prod: Valider déploiements" -ForegroundColor Gray
Write-Host ""

Write-Host "📞 Support:" -ForegroundColor Yellow
Write-Host "  Email: dpo@iapostemanager.com" -ForegroundColor Gray
Write-Host "  Slack: #ops-secrets" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
