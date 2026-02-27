# Test SMS rapide vers +33603983709
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "📱 TEST SMS RAPIDE" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:5078"
$destinataire = "+33603983706"

# Vérifier API
try {
    Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 2 | Out-Null
    Write-Host "✅ API accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API non accessible - Lancez: dotnet run" -ForegroundColor Red
    exit 1
}

# Authentification
Write-Host ""
$email = Read-Host "Email"
$password = Read-Host "Mot de passe" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

try {
    $loginBody = @{ email = $email; password = $passwordPlain } | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Authentifié" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec authentification" -ForegroundColor Red
    exit 1
}

# Message
Write-Host ""
$message = Read-Host "Message"

# Envoi
Write-Host ""
Write-Host "📤 Envoi vers $destinataire..." -ForegroundColor Yellow

try {
    $smsBody = @{ to = $destinataire; body = $message } | ConvertTo-Json
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    
    Invoke-RestMethod -Uri "$apiUrl/api/messaging/sms/send" -Method Post -Body $smsBody -Headers $headers | Out-Null
    
    Write-Host ""
    Write-Host "✅ SMS ENVOYÉ!" -ForegroundColor Green
    Write-Host "   📱 $destinataire" -ForegroundColor Gray
    Write-Host "   💬 $message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Vérifiez votre téléphone!" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ ÉCHEC" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Vérifications:" -ForegroundColor Yellow
    Write-Host "  • Configuration Twilio OK? (.\verif-twilio.ps1)" -ForegroundColor White
    Write-Host "  • Crédit Twilio suffisant?" -ForegroundColor White
    Write-Host "  • Console: https://console.twilio.com/us1/monitor/logs/sms" -ForegroundColor White
}

Write-Host ""
