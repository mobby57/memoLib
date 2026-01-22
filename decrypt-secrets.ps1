# Decrypt Secrets Script
# Charge la clé master depuis .env.keys et déchiffre les secrets

Write-Host "`n[SETUP] Initialisation du dechiffrement des secrets" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Vérifier que .env.keys existe
if (-not (Test-Path .env.keys)) {
    Write-Host "[ERREUR] Fichier .env.keys non trouve!" -ForegroundColor Red
    Write-Host "         Veuillez creer .env.keys avec votre clé master" -ForegroundColor Red
    exit 1
}

# Charger la clé master depuis .env.keys
Write-Host "`n[1/3] Chargement de la cle master depuis .env.keys..." -ForegroundColor Yellow

$envKeysContent = Get-Content .env.keys -ErrorAction SilentlyContinue
if (-not $envKeysContent) {
    Write-Host "[ERREUR] Impossible de lire .env.keys" -ForegroundColor Red
    exit 1
}

# Extraire la clé DOTENV_KEY
$masterKey = ""
foreach ($line in $envKeysContent) {
    if ($line -match "^DOTENV_KEY=(.+)$") {
        $masterKey = $matches[1].Trim()
        break
    }
}

if (-not $masterKey) {
    Write-Host "[ERREUR] DOTENV_KEY non trouvee dans .env.keys" -ForegroundColor Red
    exit 1
}

# Définir la variable d'environnement
$env:DOTENV_KEY = $masterKey
Write-Host "[OK] Cle master chargee (${masterKey.Substring(0, 8)}...)" -ForegroundColor Green

# Vérifier que dotenv-vault est installé
Write-Host "`n[2/3] Verification de dotenv-vault..." -ForegroundColor Yellow
$vaultInstalled = npm list -g dotenv-vault 2>$null | Select-String "dotenv-vault"

if (-not $vaultInstalled) {
    Write-Host "[ERREUR] dotenv-vault n'est pas installe globalement" -ForegroundColor Red
    Write-Host "         Installation en cours..." -ForegroundColor Yellow
    npm install -g dotenv-vault
}

Write-Host "[OK] dotenv-vault disponible" -ForegroundColor Green

# Dechiffrer les secrets
Write-Host "`n[3/3] Dechiffrement des secrets en cours..." -ForegroundColor Yellow
npx dotenv-vault decrypt

# Vérifier le résultat
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Secrets dechiffres avec succes!" -ForegroundColor Green
    Write-Host "          Fichier .env cree avec les secrets dechiffres" -ForegroundColor Green
    
    # Afficher un résumé
    if (Test-Path .env) {
        $envLines = (Get-Content .env | Measure-Object -Line).Lines
        Write-Host "          $envLines variables de configuration chargees" -ForegroundColor Green
    }
    
    Write-Host "`n[INFO] Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "       1. Verifier que .env contient vos secrets" -ForegroundColor Cyan
    Write-Host "       2. Ne pas committer .env dans Git (deja dans .gitignore)" -ForegroundColor Cyan
    Write-Host "       3. Committer .env.vault (fichier chiffre, securise)" -ForegroundColor Cyan
    Write-Host "       4. Partager .env.vault avec l'equipe" -ForegroundColor Cyan
    
} else {
    Write-Host "`n[ERREUR] Echec du dechiffrement!" -ForegroundColor Red
    Write-Host "         Verifiez que la cle master est correcte" -ForegroundColor Red
    Write-Host "         Verifiez que .env.vault existe et n'est pas corrompu" -ForegroundColor Red
    exit 1
}

Write-Host "`n================================================================" -ForegroundColor Cyan
