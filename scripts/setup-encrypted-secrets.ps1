# Script de configuration des secrets chiffres avec dotenv-vault
# Usage: .\setup-encrypted-secrets.ps1
# Cet script genere un fichier .env.vault chiffre contenant tous les secrets sensibles

Write-Host "[SETUP] Configuration des secrets chiffres avec dotenv-vault" -ForegroundColor Cyan
Write-Host ""

# ============================================
# ETAPE 1 : Installer dotenv-vault globalement
# ============================================

Write-Host "[1/5] Installation de dotenv-vault..." -ForegroundColor Yellow

npm list -g dotenv-vault 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "     Installation en cours..." -ForegroundColor Gray
    npm install -g dotenv-vault
}
else {
    Write-Host "     [OK] dotenv-vault deja installe" -ForegroundColor Green
}

Write-Host ""

# ============================================
# ETAPE 2 : Generer une cle de chiffrement master
# ============================================

Write-Host "[2/5] Generation de la cle master de chiffrement..." -ForegroundColor Yellow

# Generer une cle aleatoire de 64 caracteres (256 bits en base64)
$masterKey = -join ((0..63) | ForEach-Object { [char][byte](Get-Random -Minimum 33 -Maximum 126) })
$masterKeyBase64 = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($masterKey))

# Limiter a 32 caracteres pour dotenv-vault (cle simple)
$masterKeySimple = [System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 })) -replace '[+/]', ([char]((Get-Random -Minimum 97 -Maximum 122)))
$masterKeySimple = $masterKeySimple.Substring(0, 32)

Write-Host "     [OK] Cle master generee : $masterKeySimple" -ForegroundColor Green
Write-Host ""

# ============================================
# ETAPE 3 : Creer fichier .env.vault (chiffre)
# ============================================

Write-Host "[3/5] Creation du fichier .env.vault..." -ForegroundColor Yellow

$envVaultPath = ".\.env.vault"
$envVaultContent = @"
# .env.vault - Fichier de secrets chiffres
# ATTENTION: Ne jamais committer ce fichier en clair
# Il contient les cles de chiffrement pour acceder aux secrets
# A utiliser UNIQUEMENT en developpement avec la cle master

# Format: cle=valeur (chiffre avec dotenv-vault)
# Les valeurs doivent etre chiffrees via: dotenv-vault encrypt

# Exemple de structure (a remplir avec vos vrais secrets):
# DATABASE_URL=postgresql://user:pass@localhost/iapostemanage
# NEXTAUTH_SECRET=<secret_token_here>
# STRIPE_SECRET_KEY=sk_live_xxxxx
# AZURE_AD_CLIENT_SECRET=<secret>
# GITHUB_CLIENT_SECRET=<secret>

# Pour ajouter un secret:
# 1. dotenv-vault encrypt
# 2. Suivre les instructions interactives
# 3. Le secret est automatiquement chiffre et ajoute
"@

Set-Content -Path $envVaultPath -Value $envVaultContent -Encoding UTF8
Write-Host "     [OK] Fichier .env.vault cree" -ForegroundColor Green
Write-Host ""

# ============================================
# ETAPE 4 : Creer fichier .env.keys pour stocker les cles
# ============================================

Write-Host "[4/5] Creation du fichier .env.keys (stockage des cles de dechiffrement)..." -ForegroundColor Yellow

$envKeysPath = ".\.env.keys"
$envKeysContent = @"
# .env.keys - Stockage securise des cles de dechiffrement
# [!] CRITIQUE: Ce fichier DOIT etre dans .gitignore
# [!] CRITIQUE: Ne jamais committer ce fichier dans Git
# [!] CRITIQUE: A partager UNIQUEMENT via Vault securise (1Password, Dashlane, etc.)

# Cle master de dechiffrement (256 bits)
DOTENV_KEY=$masterKeySimple

# Historique des rotations (pour audit)
# DOTENV_KEY_ROTATED_AT=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# DOTENV_KEY_PREVIOUS=<ancienne_cle_si_rotation>

# Instructions pour partager cette cle:
# 1. Ne JAMAIS l'envoyer en clair par email
# 2. Utiliser un gestionnaire de secrets: 1Password, Dashlane, Bitwarden
# 3. Ou partager via Slack avec 'Dissapearing Message' (Slack Pro)
# 4. L'equipe va copier DOTENV_KEY dans leurs fichiers .env.keys locaux
# 5. Chacun peut ensuite executer: dotenv-vault decrypt --key <cle>
"@

Set-Content -Path $envKeysPath -Value $envKeysContent -Encoding UTF8
Write-Host "     [OK] Fichier .env.keys cree (a ajouter a .gitignore)" -ForegroundColor Green
Write-Host ""

# ============================================
# ETAPE 5 : Verifier .gitignore
# ============================================

Write-Host "[5/5] Verification de .gitignore..." -ForegroundColor Yellow

$gitignorePath = ".\.gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    
    if ($gitignoreContent -notmatch "\.env\.keys") {
        Add-Content $gitignorePath "`n# Secrets chiffres`n.env.keys`n"
        Write-Host "     [OK] .env.keys ajoute a .gitignore" -ForegroundColor Green
    }
    else {
        Write-Host "     [OK] .env.keys deja dans .gitignore" -ForegroundColor Green
    }
}
else {
    Write-Host "     [WARN] .gitignore non trouve - creer manuellement" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# RESUME FINAL
# ============================================

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] CONFIGURATION COMPLETE" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[FILES] Fichiers crees:" -ForegroundColor Yellow
Write-Host "  + .env.vault     - Fichier de secrets chiffres (deja dans .gitignore)" -ForegroundColor Gray
Write-Host "  + .env.keys      - Cles de dechiffrement ([!] JAMAIS committer!)" -ForegroundColor Red
Write-Host ""

Write-Host "[KEY] Votre cle master:" -ForegroundColor Yellow
Write-Host "  DOTENV_KEY=$masterKeySimple" -ForegroundColor Cyan
Write-Host ""

Write-Host "[!] SAUVEGARDE SECURISEE DE LA CLE:" -ForegroundColor Yellow
Write-Host "  1. Copier la cle ci-dessus" -ForegroundColor Gray
Write-Host "  2. Enregistrer dans: 1Password, Dashlane, Bitwarden ou Azure Key Vault" -ForegroundColor Gray
Write-Host "  3. Partager avec l'equipe via le gestionnaire de secrets" -ForegroundColor Gray
Write-Host "  4. [!] NE PAS la committer dans Git" -ForegroundColor Red
Write-Host ""

Write-Host "[NEXT] Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Executer: npx dotenv-vault encrypt" -ForegroundColor Gray
Write-Host "  2. Ajouter vos secrets interactivement" -ForegroundColor Gray
Write-Host "  3. Valider avec: npx dotenv-vault status" -ForegroundColor Gray
Write-Host "  4. Partager .env.vault ([OK] sur) via le repo" -ForegroundColor Gray
Write-Host "  5. Partager .env.keys ([!] secret) via gestionnaire de secrets" -ForegroundColor Gray
Write-Host ""

Write-Host "[TEST] Tester le dechiffrement:" -ForegroundColor Yellow
Write-Host "  npx dotenv-vault decrypt --key $masterKeySimple" -ForegroundColor Gray
Write-Host ""

Write-Host "===============================================================" -ForegroundColor Cyan
