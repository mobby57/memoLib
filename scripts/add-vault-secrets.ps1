# Ajouter secrets au Vault dotenv
param(
    [switch]$Interactive = $false
)

Write-Host "`n" -ForegroundColor Green
Write-Host "       🔐 CONFIGURATION VAULT DES SECRETS          " -ForegroundColor Green
Write-Host "" -ForegroundColor Green

# Vérifier dotenv-vault
Write-Host "[1/4] Vérification dotenv-vault..." -ForegroundColor Cyan
$vault = npm list -g dotenv-vault 2>/dev/null | Where-Object { $_ -match "dotenv-vault" }

if (-not $vault) {
    Write-Host "  ⚠️  dotenv-vault non installé" -ForegroundColor Yellow
    Write-Host "  → Installation en cours..." -ForegroundColor Gray
    npm install -g dotenv-vault
}
Write-Host "  ✅ dotenv-vault disponible" -ForegroundColor Green

# Vérifier .env.local existe
Write-Host "`n[2/4] Vérification fichier .env.local..." -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    Write-Host "  ❌ .env.local non trouvé!" -ForegroundColor Red
    Write-Host "  → Copie de .env.local.example..." -ForegroundColor Gray
    Copy-Item ".env.local.example" -Destination ".env.local"
    
    Write-Host "  ⚠️  IMPORTANT: Complétez .env.local avec vos vraies valeurs!" -ForegroundColor Yellow
    Write-Host "  Fichier créé: .env.local" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ .env.local trouvé" -ForegroundColor Green

# Initialiser Vault si nécessaire
Write-Host "`n[3/4] Initialisation Vault..." -ForegroundColor Cyan

if (-not (Test-Path ".env.vault")) {
    Write-Host "  → Création nouveau vault..." -ForegroundColor Gray
    npx dotenv-vault@latest new
    Write-Host "  ✅ Vault créé" -ForegroundColor Green
} else {
    Write-Host "  ✅ Vault existant trouvé" -ForegroundColor Green
}

# Vérifier .env.keys dans .gitignore
$gitignore = Get-Content ".gitignore" -ErrorAction SilentlyContinue
if ($gitignore -notmatch "\.env\.keys") {
    Write-Host "  ⚠️  .env.keys n'est pas dans .gitignore" -ForegroundColor Yellow
    Write-Host "  → Ajout de .env.keys à .gitignore..." -ForegroundColor Gray
    Add-Content ".gitignore" "`n.env.keys`n.env.keys.backup*"
    Write-Host "  ✅ .env.keys ajouté à .gitignore" -ForegroundColor Green
}

# Ajouter les secrets au vault
Write-Host "`n[4/4] Ajout des secrets au Vault..." -ForegroundColor Cyan

$envVars = Get-Content ".env.local" | Where-Object { $_ -match "^[A-Z_]+=.*" } | ConvertFrom-StringData

$count = 0
foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    
    # Masquer la valeur pour sécurité
    if ($value.Length -gt 20) {
        $displayValue = $value.Substring(0, 20) + "***"
    } else {
        $displayValue = "***"
    }
    
    Write-Host "  → Ajout de $key ($displayValue)..." -ForegroundColor Gray
    npx dotenv-vault@latest set $key $value | Out-Null
    $count++
}

# Chiffrer et sauvegarder
Write-Host "`n  → Chiffrement du vault..." -ForegroundColor Gray
npx dotenv-vault@latest push | Out-Null

Write-Host "`n  ✅ $count secrets ajoutés et chiffrés" -ForegroundColor Green

# Backup des clés
Write-Host "`n  → Création backup .env.keys..." -ForegroundColor Gray
New-Item -ItemType Directory -Path "backups" -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "backups/.env.keys.backup.$timestamp"
Copy-Item ".env.keys" -Destination $backupPath

Write-Host "  ✅ Backup créé: $backupPath" -ForegroundColor Green

# Afficher résumé
Write-Host "`n" -ForegroundColor Green
Write-Host "   ✅ CONFIGURATION RÉUSSIE!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  📋 Résumé:" -ForegroundColor Cyan
Write-Host "    - Secrets ajoutés: $count" -ForegroundColor White
Write-Host "    - Vault créé: .env.vault" -ForegroundColor White
Write-Host "    - Clés sauvegardées: .env.keys (en .gitignore)" -ForegroundColor White
Write-Host "    - Backup clés: $backupPath" -ForegroundColor White

Write-Host "`n  ⚠️  ACTIONS REQUISES:" -ForegroundColor Yellow
Write-Host "    1. Sauvegarder le fichier: $backupPath" -ForegroundColor White
Write-Host "    2. Stocker en lieu très sûr (password manager)" -ForegroundColor White
Write-Host "    3. Partager UNIQUEMENT .env.vault (chiffré)" -ForegroundColor White
Write-Host "    4. Ne JAMAIS partager .env.keys ou .env.local" -ForegroundColor White

Write-Host "`n  📖 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "    1. Vercel:     .\scripts\add-vercel-env.ps1" -ForegroundColor White
Write-Host "    2. Cloudflare: .\scripts\configure-cloudflare.ps1" -ForegroundColor White
Write-Host "    3. GitHub:     .\scripts\add-github-secrets.ps1" -ForegroundColor White

Write-Host "`n" -ForegroundColor Green
