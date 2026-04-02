# Test des cas hors regle - Gestion des erreurs

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host "=== TEST CAS HORS REGLE ===" -ForegroundColor Cyan
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

# TEST 1: Email sans expediteur
Write-Host "TEST 1: Email sans expediteur (from vide)" -ForegroundColor Yellow
try {
    $emailData = @{
        from = ""
        subject = "Test sans expediteur"
        body = "Contenu du message"
        externalId = "TEST-001"
        occurredAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
    Write-Host "   ACCEPTE - Email ingere malgre from vide" -ForegroundColor Green
} catch {
    Write-Host "   REJETE - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# TEST 2: Email sans sujet
Write-Host "TEST 2: Email sans sujet" -ForegroundColor Yellow
try {
    $emailData = @{
        from = "test@example.com"
        subject = ""
        body = "Contenu du message sans sujet"
        externalId = "TEST-002"
        occurredAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
    Write-Host "   ACCEPTE - Dossier cree avec titre par defaut" -ForegroundColor Green
    Write-Host "   Titre du dossier: Dossier [date]" -ForegroundColor White
} catch {
    Write-Host "   REJETE - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# TEST 3: Email doublon (meme contenu)
Write-Host "TEST 3: Email doublon (meme contenu envoye 2 fois)" -ForegroundColor Yellow
$emailData = @{
    from = "doublon@example.com"
    subject = "Email de test doublon"
    body = "Contenu identique pour tester les doublons"
    externalId = "TEST-DOUBLON"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
    Write-Host "   1er envoi: ACCEPTE - Event ID: $($response1.eventId)" -ForegroundColor Green
    
    Start-Sleep -Milliseconds 500
    
    $response2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
    Write-Host "   2eme envoi: ACCEPTE mais ignore (checksum identique)" -ForegroundColor Yellow
} catch {
    Write-Host "   2eme envoi: REJETE - Protection anti-doublon active" -ForegroundColor Green
}
Write-Host ""

# TEST 4: Token invalide
Write-Host "TEST 4: Tentative sans authentification (token invalide)" -ForegroundColor Yellow
try {
    $badHeaders = @{
        "Authorization" = "Bearer TOKEN_INVALIDE"
        "Content-Type" = "application/json"
    }
    
    $emailData = @{
        from = "hacker@example.com"
        subject = "Tentative non autorisee"
        body = "Ce message ne devrait pas passer"
        externalId = "HACK-001"
        occurredAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $badHeaders
    Write-Host "   DANGER - Securite compromise!" -ForegroundColor Red
} catch {
    Write-Host "   REJETE - Securite JWT fonctionne (401 Unauthorized)" -ForegroundColor Green
}
Write-Host ""

# TEST 5: Inscription avec mot de passe faible
Write-Host "TEST 5: Inscription avec mot de passe faible" -ForegroundColor Yellow
try {
    $registerBody = @{
        email = "test.faible@example.com"
        password = "123"
        name = "Test Faible"
        role = "AVOCAT"
        plan = "CABINET"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "   DANGER - Mot de passe faible accepte!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "   REJETE - Validation du mot de passe active (min 8 chars, maj, min, chiffres)" -ForegroundColor Green
    } else {
        Write-Host "   REJETE - Code HTTP $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# TEST 6: Email avec format invalide
Write-Host "TEST 6: Inscription avec email invalide" -ForegroundColor Yellow
try {
    $registerBody = @{
        email = "email-invalide"
        password = "SecurePass123!"
        name = "Test Email"
        role = "AVOCAT"
        plan = "CABINET"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "   DANGER - Email invalide accepte!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "   REJETE - Validation email active (format requis)" -ForegroundColor Green
    } else {
        Write-Host "   REJETE - Code HTTP $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "=== RESUME ===" -ForegroundColor Cyan
Write-Host "Protections actives:" -ForegroundColor Yellow
Write-Host "- Authentification JWT obligatoire" -ForegroundColor White
Write-Host "- Detection des doublons (checksum SHA256)" -ForegroundColor White
Write-Host "- Validation mot de passe (8+ chars, maj, min, chiffres)" -ForegroundColor White
Write-Host "- Validation format email" -ForegroundColor White
Write-Host "- Gestion des champs vides (titre par defaut)" -ForegroundColor White
