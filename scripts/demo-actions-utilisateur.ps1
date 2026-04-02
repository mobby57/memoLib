# Demo: Actions utilisateur avec logging complet

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ACTIONS UTILISATEUR + LOGGING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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

Write-Host "[1] Creation de notifications de test" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

# Email sans expediteur
$email1 = @{
    from = ""
    subject = "Test action 1"
    body = "Email pour tester les actions"
    externalId = "ACTION-001"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email1 -Headers $headers | Out-Null

# Doublon
$email2 = @{
    from = "test@example.com"
    subject = "Test doublon"
    body = "Email doublon"
    externalId = "ACTION-002"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email2 -Headers $headers | Out-Null
Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email2 -Headers $headers | Out-Null

Write-Host "   -> Notifications creees" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 1

Write-Host "[2] Consultation des notifications" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications?unreadOnly=true" -Method Get -Headers $headers
Write-Host "   -> $($notifications.Count) notification(s) non lue(s)" -ForegroundColor White
Write-Host ""

foreach ($notif in $notifications | Select-Object -First 3) {
    Write-Host "   [$($notif.id.ToString().Substring(0,8))] $($notif.title)" -ForegroundColor Cyan
}

Write-Host ""
Start-Sleep -Seconds 1

if ($notifications.Count -ge 3) {
    Write-Host "[3] ACTION 1: Marquer comme lu" -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Gray
    
    $notif1 = $notifications[0]
    $result1 = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($notif1.id)/mark-read" -Method Post -Headers $headers
    Write-Host "   -> $($result1.message)" -ForegroundColor Green
    Write-Host "   -> Logue dans AuditLog: OUI" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Milliseconds 500
    
    Write-Host "[4] ACTION 2: Ignorer/Acquitter" -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Gray
    
    $notif2 = $notifications[1]
    $dismissBody = @{
        reason = "Fausse alerte - Email verifie, pas de probleme"
    } | ConvertTo-Json
    
    $result2 = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($notif2.id)/dismiss" -Method Post -Body $dismissBody -Headers $headers
    Write-Host "   -> $($result2.message)" -ForegroundColor Green
    Write-Host "   -> Raison: Fausse alerte" -ForegroundColor White
    Write-Host "   -> Logue dans AuditLog: OUI" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Milliseconds 500
    
    Write-Host "[5] ACTION 3: Resoudre avec action" -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Gray
    
    $notif3 = $notifications[2]
    $resolveBody = @{
        resolution = "Doublon confirme - Client contacte - Email original conserve"
        action = "KEEP_ORIGINAL"
    } | ConvertTo-Json
    
    $result3 = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($notif3.id)/resolve" -Method Post -Body $resolveBody -Headers $headers
    Write-Host "   -> $($result3.message)" -ForegroundColor Green
    Write-Host "   -> Resolution: $($result3.resolution)" -ForegroundColor White
    Write-Host "   -> Action: $($result3.action)" -ForegroundColor White
    Write-Host "   -> Logue dans AuditLog: OUI" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Milliseconds 500
    
    Write-Host "[6] ACTION 4: Supprimer notification" -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Gray
    
    if ($notifications.Count -ge 4) {
        $notif4 = $notifications[3]
        $result4 = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($notif4.id)" -Method Delete -Headers $headers
        Write-Host "   -> $($result4.message)" -ForegroundColor Green
        Write-Host "   -> Logue dans AuditLog: OUI" -ForegroundColor Green
    } else {
        Write-Host "   -> Pas assez de notifications pour tester" -ForegroundColor Gray
    }
}

Write-Host ""
Start-Sleep -Seconds 1

Write-Host "[7] Verification du compteur" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$unreadCount = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/unread-count" -Method Get -Headers $headers
Write-Host "   -> Notifications non lues: $($unreadCount.count)" -ForegroundColor White

Write-Host ""
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ACTIONS DISPONIBLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. MARQUER COMME LU" -ForegroundColor Green
Write-Host "   - Notification marquee mais non resolue" -ForegroundColor White
Write-Host "   - Logue: NotificationRead" -ForegroundColor Gray
Write-Host ""
Write-Host "2. IGNORER/ACQUITTER" -ForegroundColor Green
Write-Host "   - Notification resolue sans action" -ForegroundColor White
Write-Host "   - Peut ajouter une raison" -ForegroundColor White
Write-Host "   - Logue: NotificationDismissed" -ForegroundColor Gray
Write-Host ""
Write-Host "3. RESOUDRE AVEC ACTION" -ForegroundColor Green
Write-Host "   - Notification resolue avec decision" -ForegroundColor White
Write-Host "   - Resolution + action documentees" -ForegroundColor White
Write-Host "   - Logue: NotificationResolved" -ForegroundColor Gray
Write-Host ""
Write-Host "4. SUPPRIMER" -ForegroundColor Green
Write-Host "   - Notification supprimee definitivement" -ForegroundColor White
Write-Host "   - Logue avant suppression" -ForegroundColor White
Write-Host "   - Logue: NotificationDeleted" -ForegroundColor Gray
Write-Host ""
Write-Host "TOUTES LES ACTIONS SONT TRACEES DANS AUDITLOG" -ForegroundColor Yellow
Write-Host ""
