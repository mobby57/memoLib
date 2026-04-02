# Test envoi SMS via MemoLib
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST ENVOI SMS VIA MEMOLIB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:5078"

# Vérifier que l'API est démarrée
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
    Write-Host "✅ API MemoLib accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API MemoLib non accessible sur $apiUrl" -ForegroundColor Red
    Write-Host "   Lancez d'abord: dotnet run" -ForegroundColor Yellow
    exit 1
}

# Vérifier la configuration Twilio
Write-Host ""
Write-Host "🔍 Vérification configuration Twilio..." -ForegroundColor Yellow

$accountSid = dotnet user-secrets list 2>$null | Select-String "Twilio:AccountSid" | ForEach-Object { $_.ToString().Split('=')[1].Trim() }
$authToken = dotnet user-secrets list 2>$null | Select-String "Twilio:AuthToken" | ForEach-Object { $_.ToString().Split('=')[1].Trim() }
$phoneNumber = dotnet user-secrets list 2>$null | Select-String "Twilio:PhoneNumber" | ForEach-Object { $_.ToString().Split('=')[1].Trim() }

if ([string]::IsNullOrEmpty($accountSid) -or [string]::IsNullOrEmpty($authToken) -or [string]::IsNullOrEmpty($phoneNumber)) {
    Write-Host "❌ Configuration Twilio manquante!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Exécutez d'abord:" -ForegroundColor Yellow
    Write-Host "  .\configure-twilio.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Configuration Twilio OK" -ForegroundColor Green
Write-Host "   Account SID: $($accountSid.Substring(0, 10))..." -ForegroundColor Gray
Write-Host "   Numéro: $phoneNumber" -ForegroundColor Gray

# Authentification
Write-Host ""
Write-Host "🔐 Authentification..." -ForegroundColor Yellow

$email = Read-Host "Email utilisateur"
$password = Read-Host "Mot de passe" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

try {
    $loginBody = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    
    Write-Host "✅ Authentification réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec authentification: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Créez un compte sur: http://localhost:5078/demo.html" -ForegroundColor Yellow
    exit 1
}

# Envoi SMS
Write-Host ""
Write-Host "📱 Envoi SMS..." -ForegroundColor Yellow
Write-Host ""

$to = Read-Host "Numéro destinataire (+33XXXXXXXXX)"
$message = Read-Host "Message"

$smsBody = @{
    to = $to
    body = $message
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$apiUrl/api/messaging/sms/send" -Method Post -Body $smsBody -Headers $headers
    
    Write-Host ""
    Write-Host "✅ SMS envoyé avec succès!" -ForegroundColor Green
    Write-Host "   Destinataire: $to" -ForegroundColor Gray
    Write-Host "   Message: $message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Vérifiez dans MemoLib:" -ForegroundColor Cyan
    Write-Host "   http://localhost:5078/demo.html" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Échec envoi SMS" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Détails: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🔍 Vérifications:" -ForegroundColor Yellow
    Write-Host "   1. Configuration Twilio correcte?" -ForegroundColor White
    Write-Host "   2. Crédit Twilio suffisant?" -ForegroundColor White
    Write-Host "   3. Numéro au format international? (+33...)" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Console Twilio:" -ForegroundColor Cyan
    Write-Host "   https://console.twilio.com/us1/monitor/logs/sms" -ForegroundColor White
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
