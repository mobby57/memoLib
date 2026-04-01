# Vérification configuration Twilio
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   VERIFICATION CONFIGURATION TWILIO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les secrets
$secretLines = dotnet user-secrets list 2>$null

function Get-SecretValue([string]$key) {
    $line = $secretLines | Select-String "^$([regex]::Escape($key))\s*=" | Select-Object -First 1
    if ($null -eq $line) { return $null }
    return ($line.ToString().Split('=', 2)[1]).Trim()
}

$required = @{
    "Twilio:AccountSid" = "Account SID"
    "Twilio:PhoneNumber" = "Numéro SMS"
    "Twilio:WhatsAppNumber" = "Numéro WhatsApp"
}

$allOk = $true

foreach ($key in $required.Keys) {
    $value = Get-SecretValue $key
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "❌ $($required[$key]): NON CONFIGURÉ" -ForegroundColor Red
        $allOk = $false
    } else {
        Write-Host "✅ $($required[$key]): $value" -ForegroundColor Green
    }
}

$apiKeySid = Get-SecretValue "Twilio:ApiKeySid"
$apiKeySecret = Get-SecretValue "Twilio:ApiKeySecret"
$authToken = Get-SecretValue "Twilio:AuthToken"

if (-not [string]::IsNullOrEmpty($apiKeySid) -and -not [string]::IsNullOrEmpty($apiKeySecret)) {
    Write-Host "✅ API Key SID: $apiKeySid" -ForegroundColor Green
    Write-Host "✅ API Key Secret: ********" -ForegroundColor Green
}
elseif (-not [string]::IsNullOrEmpty($authToken)) {
    Write-Host "✅ Auth Token (fallback): ********" -ForegroundColor Green
}
else {
    Write-Host "❌ Auth Twilio: NON CONFIGURÉ (API Key SID/Secret ou Auth Token requis)" -ForegroundColor Red
    $allOk = $false
}

Write-Host ""

if ($allOk) {
    Write-Host "🎉 Configuration Twilio complète!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Lancez l'API: dotnet run" -ForegroundColor White
    Write-Host "  2. Testez l'envoi: .\test-sms.ps1" -ForegroundColor White
    Write-Host "  3. Configurez les webhooks avec ngrok" -ForegroundColor White
} else {
    Write-Host "⚠️  Configuration incomplète" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exécutez:" -ForegroundColor Cyan
    Write-Host "  .\configure-twilio.ps1" -ForegroundColor White
}

Write-Host ""
