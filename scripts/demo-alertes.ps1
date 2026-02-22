# Demo: Systeme d'alertes - Rien n'est oublie

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host "=== DEMO: SYSTEME D'ALERTES ===" -ForegroundColor Cyan
Write-Host "Principe: TOUS les emails sont acceptes, mais ceux avec anomalies sont signales" -ForegroundColor Yellow
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

# Email 1: Normal
Write-Host "1. Email normal (complet)" -ForegroundColor Green
$email1 = @{
    from = "client.normal@example.com"
    subject = "Consultation juridique"
    body = "Bonjour, je souhaite une consultation."
    externalId = "NORMAL-001"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email1 -Headers $headers
Write-Host "   Ingere - Attention requise: $($response1.requiresAttention)" -ForegroundColor White
Write-Host "   Flags: $($response1.validationFlags -join ', ')" -ForegroundColor White
Write-Host ""

# Email 2: Sans expediteur
Write-Host "2. Email SANS expediteur (anomalie)" -ForegroundColor Yellow
$email2 = @{
    from = ""
    subject = "Email sans expediteur"
    body = "Ce message n'a pas d'expediteur identifie."
    externalId = "ANOMALIE-001"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email2 -Headers $headers
Write-Host "   Ingere - Attention requise: $($response2.requiresAttention)" -ForegroundColor Red
Write-Host "   Flags: $($response2.validationFlags -join ', ')" -ForegroundColor Red
Write-Host ""

# Email 3: Sans sujet
Write-Host "3. Email SANS sujet (anomalie)" -ForegroundColor Yellow
$email3 = @{
    from = "client.sanssujet@example.com"
    subject = ""
    body = "Email important mais sans sujet."
    externalId = "ANOMALIE-002"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email3 -Headers $headers
Write-Host "   Ingere - Attention requise: $($response3.requiresAttention)" -ForegroundColor Red
Write-Host "   Flags: $($response3.validationFlags -join ', ')" -ForegroundColor Red
Write-Host ""

# Email 4: Corps vide
Write-Host "4. Email SANS contenu (anomalie)" -ForegroundColor Yellow
$email4 = @{
    from = "client.vide@example.com"
    subject = "Email vide"
    body = ""
    externalId = "ANOMALIE-003"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response4 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email4 -Headers $headers
Write-Host "   Ingere - Attention requise: $($response4.requiresAttention)" -ForegroundColor Red
Write-Host "   Flags: $($response4.validationFlags -join ', ')" -ForegroundColor Red
Write-Host ""

# Consultation des alertes
Write-Host "5. Consultation des emails necessitant attention" -ForegroundColor Cyan
$alerts = Invoke-RestMethod -Uri "http://localhost:8080/api/alerts/requires-attention" -Method Get -Headers $headers
Write-Host "   $($alerts.count) email(s) necessitent votre attention:" -ForegroundColor Red

foreach ($event in $alerts.events) {
    $payload = $event.rawPayload | ConvertFrom-Json
    Write-Host ""
    Write-Host "   - De: $($payload.from)" -ForegroundColor White
    Write-Host "     Sujet: $($payload.subject)" -ForegroundColor White
    Write-Host "     Flags: $($event.validationFlags)" -ForegroundColor Yellow
    Write-Host "     Date: $(([DateTime]$event.occurredAt).ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== AVANTAGES ===" -ForegroundColor Cyan
Write-Host "- Aucun email n'est rejete ou perdu" -ForegroundColor Green
Write-Host "- Les anomalies sont signalees automatiquement" -ForegroundColor Green
Write-Host "- L'avocat decide de l'action a prendre" -ForegroundColor Green
Write-Host "- Traçabilite complete de tous les emails" -ForegroundColor Green
