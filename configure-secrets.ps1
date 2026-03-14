# Configuration rapide des secrets MemoLib
Write-Host "Configuration des secrets MemoLib" -ForegroundColor Cyan
Write-Host ""

# 1. Mot de passe Gmail
Write-Host "Configuration Email Gmail" -ForegroundColor Yellow
Write-Host "Votre email: <votre-email@gmail.com>"
$gmailPassword = Read-Host "Entrez votre mot de passe d'application Gmail" -AsSecureString
$gmailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($gmailPassword))

if ($gmailPasswordPlain) {
    dotnet user-secrets set "EmailMonitor:Password" $gmailPasswordPlain
    Write-Host "Mot de passe Gmail configure" -ForegroundColor Green
}

# 2. JWT Secret Key
Write-Host ""
Write-Host "Configuration JWT Secret" -ForegroundColor Yellow
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
Write-Host "JWT Secret genere et configure" -ForegroundColor Green

# 3. Vault Master Key
Write-Host ""
Write-Host "Configuration Vault Master Key" -ForegroundColor Yellow
$vaultKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
dotnet user-secrets set "Vault:MasterKey" $vaultKey
Write-Host "Vault Master Key genere et configure" -ForegroundColor Green

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Secrets configures:" -ForegroundColor Cyan
Write-Host "   - EmailMonitor:Password (Gmail)"
Write-Host "   - JwtSettings:SecretKey"
Write-Host "   - Vault:MasterKey"
Write-Host ""
Write-Host "Vous pouvez maintenant lancer: dotnet run" -ForegroundColor Green
