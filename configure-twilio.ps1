# Configuration sécurisée Twilio pour MemoLib
# Les identifiants restent HORS du code source

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURATION SECURISEE TWILIO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Vos identifiants seront stockes de facon securisee" -ForegroundColor Cyan
Write-Host "JAMAIS dans le code source, JAMAIS dans Git" -ForegroundColor Cyan
Write-Host ""

# Demander les identifiants
Write-Host "Entrez vos identifiants Twilio :" -ForegroundColor Yellow
Write-Host ""

$accountSid = Read-Host "Account SID (ACxxxxxxxxx)"
$apiKeySid = Read-Host "API Key SID (SKxxxxxxxxx, optionnel)"
$apiKeySecret = Read-Host "API Key Secret (optionnel)" -AsSecureString
$apiKeySecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKeySecret))
$authToken = Read-Host "Auth Token (fallback/dev, optionnel)" -AsSecureString
$authTokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($authToken))
$phoneNumber = Read-Host "Numero SMS (+33XXXXXXXXX)"
$whatsappNumber = Read-Host "Numero WhatsApp (defaut: +14155238886)"

if ([string]::IsNullOrWhiteSpace($whatsappNumber)) {
    $whatsappNumber = "+14155238886"
}

Write-Host ""
Write-Host "Configuration en cours..." -ForegroundColor Yellow

# Configurer les secrets
dotnet user-secrets set "Twilio:AccountSid" "$accountSid"
if (-not [string]::IsNullOrWhiteSpace($apiKeySid) -and -not [string]::IsNullOrWhiteSpace($apiKeySecretPlain)) {
    dotnet user-secrets set "Twilio:ApiKeySid" "$apiKeySid"
    dotnet user-secrets set "Twilio:ApiKeySecret" "$apiKeySecretPlain"
}

if (-not [string]::IsNullOrWhiteSpace($authTokenPlain)) {
    dotnet user-secrets set "Twilio:AuthToken" "$authTokenPlain"
}
dotnet user-secrets set "Twilio:PhoneNumber" "$phoneNumber"
dotnet user-secrets set "Twilio:WhatsAppNumber" "$whatsappNumber"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURATION TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Vos identifiants sont stockes dans :" -ForegroundColor Cyan
Write-Host "%APPDATA%\Microsoft\UserSecrets\..." -ForegroundColor Gray
Write-Host ""

Write-Host "SECURITE :" -ForegroundColor Green
Write-Host "- JAMAIS dans le code source" -ForegroundColor White
Write-Host "- JAMAIS dans Git" -ForegroundColor White
Write-Host "- Uniquement sur VOTRE machine" -ForegroundColor White
Write-Host ""

Write-Host "Pour verifier la configuration :" -ForegroundColor Yellow
Write-Host "dotnet user-secrets list" -ForegroundColor Gray
Write-Host ""

Write-Host "Redemarrez MemoLib pour appliquer les changements" -ForegroundColor Cyan
Write-Host ""

pause
