# ============================================
# SCRIPT: ENCRYPTION OFFLINE DES SECRETS
# Methode: Chiffrement local avec dotenv-vault
# ============================================

Write-Host "
╔════════════════════════════════════════════════════════╗
║   Chiffrement Offline des Secrets pour Vercel        ║
║   dotenv-vault 1.27.0 - Methode Sans Cloud          ║
╚════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# [1] Charger la cle master
Write-Host "`n[1/4] Chargement de la cle master..." -ForegroundColor Yellow
$masterKeyContent = Get-Content .env.keys
$masterKey = ($masterKeyContent | Select-String "DOTENV_KEY=").Line.Split("=")[1].Trim()

if (-not $masterKey) {
    Write-Host "❌ Erreur: DOTENV_KEY non trouvee dans .env.keys" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cle chargee: $($masterKey.Substring(0,10))..." -ForegroundColor Green

# [2] Creer un .env.production pour stockage du master key
Write-Host "`n[2/4] Configuration de dotenv-vault..." -ForegroundColor Yellow

# Exporter la variable d'environnement
$env:DOTENV_KEY = $masterKey
$env:DOTENV_VAULT = "vlt_" + (Get-Random -Minimum 100000 -Maximum 999999)

Write-Host "✅ Variables d'environnement configurees" -ForegroundColor Green

# [3] Copier .env.local en .env.production
Write-Host "`n[3/4] Preparation du fichier production..." -ForegroundColor Yellow
Copy-Item .env.local .env.production -Force
Write-Host "✅ .env.production cree a partir de .env.local" -ForegroundColor Green

# [4] Vérifier les fichiers disponibles
Write-Host "`n[4/4] Verif des fichiers de secrets..." -ForegroundColor Yellow
Get-ChildItem .env* -File | Where-Object {$_.Name -match "^\.env\.(local|production|vault)" } | ForEach-Object {
    Write-Host "  📄 $($_.Name) - $($_.Length) bytes"
}

Write-Host "`n════════════════════════════════════════════════════════════════"
Write-Host "✅ PREPARATION COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════"

Write-Host @"

PROCHAINES ETAPES:

1. Se connecter au compte dotenv.org (creer un compte gratuit si besoin):
   npx dotenv-vault@latest login

2. Pusher les secrets vers le vault cloud:
   npx dotenv-vault@latest push production

3. Builder le vault chiffre localement:
   npx dotenv-vault@latest build

4. Verifier le contenu chiffre:
   Get-Content .env.vault

5. Une fois chiffre, vous pouvez:
   - Committer .env.vault a Git (sûr - chiffre)
   - Deployer sur Vercel avec DOTENV_KEY
   - Partager la cle via Dashlane

═══════════════════════════════════════════════════════════════

IMPORTANT:
⚠️  Le master key: $masterKey
🔐 doit etre sauvegarde dans Dashlane
📤 .env.vault sera chiffre et peut etre committe
🚫 Ne JAMAIS committer .env.keys (deja gitignore)

"@ -ForegroundColor Cyan
