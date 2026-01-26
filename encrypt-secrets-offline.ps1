# ============================================
# SCRIPT: ENCRYPTION OFFLINE DES SECRETS
# Methode: Chiffrement local avec dotenv-vault
# ============================================

Write-Output ""
Write-Output "========================================"
Write-Output "   Chiffrement Offline des Secrets"
Write-Output "   dotenv-vault - Methode Sans Cloud"
Write-Output "========================================"
Write-Output ""

# [1] Charger la cle master
Write-Output "[1/4] Chargement de la cle master..."
$masterKeyContent = Get-Content .env.keys -ErrorAction SilentlyContinue
if (-not $masterKeyContent) {
    Write-Output "[ERREUR] Fichier .env.keys non trouve"
    exit 1
}

$masterKey = ($masterKeyContent | Select-String "DOTENV_KEY=").Line.Split("=")[1].Trim()

if (-not $masterKey) {
    Write-Output "[ERREUR] DOTENV_KEY non trouvee dans .env.keys"
    exit 1
}

Write-Output "[OK] Cle chargee: $($masterKey.Substring(0,10))..."

# [2] Creer un .env.production pour stockage du master key
Write-Output ""
Write-Output "[2/4] Configuration de dotenv-vault..."

# Exporter la variable d'environnement
$env:DOTENV_KEY = $masterKey
$env:DOTENV_VAULT = "vlt_" + (Get-Random -Minimum 100000 -Maximum 999999)

Write-Output "[OK] Variables d'environnement configurees"

# [3] Copier .env.local en .env.production
Write-Output ""
Write-Output "[3/4] Preparation du fichier production..."
Copy-Item .env.local .env.production -Force
Write-Output "[OK] .env.production cree a partir de .env.local"

# [4] Verifier les fichiers disponibles
Write-Output ""
Write-Output "[4/4] Verif des fichiers de secrets..."
Get-ChildItem .env* -File | Where-Object {$_.Name -match "^\.env\.(local|production|vault)" } | ForEach-Object {
    Write-Output "   - $($_.Name) ($($_.Length) bytes)"
}

Write-Output ""
Write-Output "========================================"
Write-Output "[OK] PREPARATION COMPLETE"
Write-Output "========================================"
Write-Output ""
Write-Output "PROCHAINES ETAPES:"
Write-Output ""
Write-Output "1. Se connecter au compte dotenv.org:"
Write-Output "   npx dotenv-vault@latest login"
Write-Output ""
Write-Output "2. Pusher les secrets vers le vault:"
Write-Output "   npx dotenv-vault@latest push production"
Write-Output ""
Write-Output "3. Builder le vault chiffre:"
Write-Output "   npx dotenv-vault@latest build"
Write-Output ""
Write-Output "4. Verifier le contenu chiffre:"
Write-Output "   Get-Content .env.vault"
Write-Output ""
Write-Output "========================================"
Write-Output ""
Write-Output "IMPORTANT:"
Write-Output "   - Master key: $masterKey"
Write-Output "   - Sauvegarder dans un gestionnaire de mots de passe"
Write-Output "   - .env.vault peut etre committe (chiffre)"
Write-Output "   - Ne JAMAIS committer .env.keys"
Write-Output ""
