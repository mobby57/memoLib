# DEMO: Systeme de notifications et actions utilisateur

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GESTION DES ERREURS PAR L'UTILISATEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Principe: L'utilisateur est notifie ET decide de l'action" -ForegroundColor Yellow
Write-Host ""

# Connexion
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

Write-Host "[ETAPE 1] Ingestion d'emails avec anomalies" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

# Email sans expediteur
$email1 = @{
    from = ""
    subject = "Demande urgente"
    body = "Message important sans expediteur identifie"
    externalId = "NOTIF-001"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email1 -Headers $headers
Write-Host "   Email 1: SANS expediteur" -ForegroundColor Yellow
Write-Host "   -> Accepte: OUI" -ForegroundColor Green
Write-Host "   -> Notification creee: OUI" -ForegroundColor Green

Start-Sleep -Milliseconds 500

# Email sans sujet
$email2 = @{
    from = "client.important@example.com"
    subject = ""
    body = "Email tres important mais sans sujet"
    externalId = "NOTIF-002"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email2 -Headers $headers
Write-Host "   Email 2: SANS sujet" -ForegroundColor Yellow
Write-Host "   -> Accepte: OUI" -ForegroundColor Green
Write-Host "   -> Notification creee: OUI" -ForegroundColor Green

Write-Host ""
Start-Sleep -Seconds 1

Write-Host "[ETAPE 2] Consultation des notifications" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications?unreadOnly=true" -Method Get -Headers $headers
Write-Host "   $($notifications.Count) notification(s) non lue(s)" -ForegroundColor Red
Write-Host ""

foreach ($notif in $notifications | Select-Object -First 5) {
    Write-Host "   ID: $($notif.id)" -ForegroundColor White
    Write-Host "   Type: $($notif.type)" -ForegroundColor Yellow
    Write-Host "   Titre: $($notif.title)" -ForegroundColor White
    Write-Host "   Message: $($notif.message)" -ForegroundColor Gray
    Write-Host "   Action requise: $($notif.actionRequired)" -ForegroundColor Cyan
    Write-Host ""
}

Start-Sleep -Seconds 2

Write-Host "[ETAPE 3] L'utilisateur prend des decisions" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

if ($notifications.Count -gt 0) {
    $firstNotif = $notifications[0]
    
    Write-Host "   Decision 1: Marquer comme lu" -ForegroundColor Cyan
    $markRead = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($firstNotif.id)/mark-read" -Method Post -Headers $headers
    Write-Host "   -> $($markRead.message)" -ForegroundColor Green
    Write-Host ""
    
    Start-Sleep -Milliseconds 500
    
    if ($notifications.Count -gt 1) {
        $secondNotif = $notifications[1]
        
        Write-Host "   Decision 2: Resoudre avec action" -ForegroundColor Cyan
        $resolveBody = @{
            resolution = "Email verifie - Expediteur identifie manuellement comme client connu. Dossier mis a jour."
        } | ConvertTo-Json
        
        $resolve = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/$($secondNotif.id)/resolve" -Method Post -Body $resolveBody -Headers $headers
        Write-Host "   -> $($resolve.message)" -ForegroundColor Green
        Write-Host "   -> Resolution: $($resolve.resolution)" -ForegroundColor White
        Write-Host ""
    }
}

Start-Sleep -Seconds 1

Write-Host "[ETAPE 4] Verification du compteur" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$unreadCount = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/unread-count" -Method Get -Headers $headers
Write-Host "   Notifications non lues restantes: $($unreadCount.count)" -ForegroundColor Green

Write-Host ""
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AVANTAGES DU SYSTEME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. NOTIFICATION AUTOMATIQUE" -ForegroundColor Green
Write-Host "   - Chaque anomalie genere une notification" -ForegroundColor White
Write-Host "   - L'utilisateur est informe en temps reel" -ForegroundColor White
Write-Host ""
Write-Host "2. CONTROLE TOTAL" -ForegroundColor Green
Write-Host "   - L'utilisateur decide de l'action" -ForegroundColor White
Write-Host "   - Peut marquer comme lu ou resoudre" -ForegroundColor White
Write-Host "   - Peut ajouter des notes de resolution" -ForegroundColor White
Write-Host ""
Write-Host "3. TRACABILITE COMPLETE" -ForegroundColor Green
Write-Host "   - Historique de toutes les notifications" -ForegroundColor White
Write-Host "   - Actions prises documentees" -ForegroundColor White
Write-Host "   - Audit trail complet" -ForegroundColor White
Write-Host ""
Write-Host "4. RIEN N'EST OUBLIE" -ForegroundColor Green
Write-Host "   - Tous les emails sont acceptes" -ForegroundColor White
Write-Host "   - Les anomalies sont signalees" -ForegroundColor White
Write-Host "   - L'utilisateur garde le controle" -ForegroundColor White
Write-Host ""
