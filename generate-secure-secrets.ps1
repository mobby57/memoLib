# 🔐 Script de Génération de Secrets Sécurisés
# Usage: .\generate-secure-secrets.ps1

Write-Host "🔐 Génération de secrets sécurisés pour MemoLib..." -ForegroundColor Cyan
Write-Host ""

# Fonction pour générer un secret aléatoire
function Generate-SecureSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# 1. JWT Secret Key
Write-Host "📝 Génération JWT SecretKey..." -ForegroundColor Yellow
$jwtSecret = Generate-SecureSecret -Length 32
dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
Write-Host "✅ JWT SecretKey configuré" -ForegroundColor Green

# 2. Vault Master Key
Write-Host "📝 Génération Vault MasterKey..." -ForegroundColor Yellow
$vaultKey = Generate-SecureSecret -Length 32
dotnet user-secrets set "Vault:MasterKey" $vaultKey
Write-Host "✅ Vault MasterKey configuré" -ForegroundColor Green

# 3. Afficher les secrets (pour backup manuel)
Write-Host ""
Write-Host "📋 Secrets générés (SAUVEGARDEZ-LES EN LIEU SÛR):" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "JwtSettings:SecretKey = $jwtSecret" -ForegroundColor White
Write-Host "Vault:MasterKey = $vaultKey" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  NE COMMITEZ JAMAIS CES VALEURS DANS GIT!" -ForegroundColor Red
Write-Host ""

# 4. Vérifier la configuration
Write-Host "🔍 Vérification de la configuration..." -ForegroundColor Yellow
$secrets = dotnet user-secrets list
Write-Host $secrets
Write-Host ""

Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Sauvegardez les secrets ci-dessus dans un gestionnaire de mots de passe"
Write-Host "  2. Supprimez les secrets de appsettings.json"
Write-Host "  3. Ajoutez appsettings.*.json au .gitignore"
Write-Host "  4. Testez l'application: dotnet run"
Write-Host ""
