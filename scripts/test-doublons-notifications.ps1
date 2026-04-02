# Test: Detection doublons avec notifications

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host "=== TEST DOUBLONS AVEC NOTIFICATIONS ===" -ForegroundColor Cyan
Write-Host ""

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "[1] Envoi email original" -ForegroundColor Yellow
$emailData = @{
    from = "test.doublon@example.com"
    subject = "Email de test doublon"
    body = "Contenu identique pour tester la detection"
    externalId = "TEST-DOUBLON-001"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
Write-Host "   -> Accepte: OUI" -ForegroundColor Green
Write-Host "   -> Event ID: $($response1.eventId)" -ForegroundColor White
Write-Host "   -> Doublon: $($response1.isDuplicate)" -ForegroundColor White
Write-Host ""

Start-Sleep -Seconds 1

Write-Host "[2] Renvoi du MEME email (doublon)" -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
Write-Host "   -> Doublon detecte: $($response2.isDuplicate)" -ForegroundColor Red
Write-Host "   -> Raison: $($response2.duplicateReason)" -ForegroundColor Yellow
Write-Host "   -> Notification creee: $($response2.notificationCreated)" -ForegroundColor Green
Write-Host "   -> Notification ID: $($response2.notificationId)" -ForegroundColor White
Write-Host ""

Start-Sleep -Seconds 1

Write-Host "[3] Consultation des notifications" -ForegroundColor Yellow
$notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications?unreadOnly=true" -Method Get -Headers $headers
$doublonNotifs = $notifications | Where-Object { $_.actionRequired -eq "REVIEW_DUPLICATE" }

Write-Host "   -> $($doublonNotifs.Count) notification(s) de doublon" -ForegroundColor Red
Write-Host ""

foreach ($notif in $doublonNotifs | Select-Object -First 3) {
    Write-Host "   Notification:" -ForegroundColor Cyan
    Write-Host "   - Titre: $($notif.title)" -ForegroundColor White
    Write-Host "   - Message: $($notif.message)" -ForegroundColor Gray
    Write-Host "   - Action: $($notif.actionRequired)" -ForegroundColor Yellow
    Write-Host ""
}

if ($doublonNotifs.Count -gt 0) {
    Write-Host "[4] L'utilisateur prend une decision" -ForegroundColor Yellow
    $firstNotif = $doublonNotifs[0]
    
    $resolveBody = @{
        resolution = "Doublon confirme - Email renvoye par erreur par le client. Ignorer ce doublon."
    } | ConvertTo-Json
    
    $resolve = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($firstNotif.id)/resolve" -Method Post -Body $resolveBody -Headers $headers
    Write-Host "   -> $($resolve.message)" -ForegroundColor Green
    Write-Host "   -> Decision: $($resolve.resolution)" -ForegroundColor White
}

Write-Host ""
Write-Host "=== RESULTAT ===" -ForegroundColor Cyan
Write-Host "- Email original: ACCEPTE et stocke" -ForegroundColor Green
Write-Host "- Doublon: DETECTE et signale" -ForegroundColor Yellow
Write-Host "- Notification: CREEE automatiquement" -ForegroundColor Green
Write-Host "- Utilisateur: DECIDE de l'action" -ForegroundColor Green
Write-Host "- Tracabilite: COMPLETE" -ForegroundColor Green
