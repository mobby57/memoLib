# ========================================
# DEMO COMPLETE MEMOLIB - PRESENTATION CLIENT
# ========================================

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MEMOLIB - DEMO COMPLETE CLIENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Systeme de gestion intelligente des communications" -ForegroundColor White
Write-Host "pour cabinets d'avocats" -ForegroundColor White
Write-Host ""

# Connexion
Write-Host "[1/7] AUTHENTIFICATION" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   OK - Utilisateur connecte: $email" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Impossible de se connecter" -ForegroundColor Red
    Write-Host "   Verifiez que l'API est demarree sur http://localhost:8080" -ForegroundColor Yellow
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""
Start-Sleep -Seconds 1

# Ingestion emails normaux
Write-Host "[2/7] INGESTION EMAILS NORMAUX" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$email1 = @{
    from = "jean.dupont@client.fr"
    subject = "Consultation divorce - Urgent"
    body = "Bonjour Maitre, Je souhaite une consultation concernant une procedure de divorce. Mon epouse et moi sommes maries depuis 15 ans. Nous avons 2 enfants. Pouvez-vous me recevoir cette semaine? Cordialement, Jean Dupont"
    externalId = "DOSSIER-DUPONT-2024"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email1 -Headers $headers
Write-Host "   Email 1: De Jean Dupont - Divorce" -ForegroundColor White
Write-Host "   -> Dossier cree: $($response1.caseCreated)" -ForegroundColor Green
Write-Host "   -> Attention requise: $($response1.requiresAttention)" -ForegroundColor Green

Start-Sleep -Milliseconds 500

$email2 = @{
    from = "marie.martin@client.fr"
    subject = "Litige commercial - Facture impayee"
    body = "Bonjour, Mon entreprise a un litige avec un fournisseur qui ne paie pas ses factures depuis 6 mois. Montant: 45000 euros. Que puis-je faire?"
    externalId = "DOSSIER-MARTIN-2024"
    occurredAt = (Get-Date).AddHours(1).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email2 -Headers $headers
Write-Host "   Email 2: De Marie Martin - Litige commercial" -ForegroundColor White
Write-Host "   -> Dossier cree: $($response2.caseCreated)" -ForegroundColor Green

Write-Host ""
Start-Sleep -Seconds 1

# Ingestion emails avec anomalies
Write-Host "[3/7] INGESTION EMAILS AVEC ANOMALIES" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "   Principe: AUCUN email n'est rejete" -ForegroundColor Cyan
Write-Host "   Les anomalies sont signalees pour decision" -ForegroundColor Cyan
Write-Host ""

$email3 = @{
    from = ""
    subject = "Email sans expediteur"
    body = "Ce message n'a pas d'expediteur identifie mais contient des informations importantes."
    externalId = "ANOMALIE-001"
    occurredAt = (Get-Date).AddHours(2).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email3 -Headers $headers
Write-Host "   Email 3: SANS expediteur" -ForegroundColor Yellow
Write-Host "   -> Accepte: OUI" -ForegroundColor Green
Write-Host "   -> Attention requise: $($response3.requiresAttention)" -ForegroundColor Red
Write-Host "   -> Flags: $($response3.validationFlags -join ', ')" -ForegroundColor Red

Start-Sleep -Milliseconds 500

$email4 = @{
    from = "client.urgent@example.com"
    subject = ""
    body = "Message urgent sans sujet mais tres important pour le dossier."
    externalId = "ANOMALIE-002"
    occurredAt = (Get-Date).AddHours(3).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$response4 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $email4 -Headers $headers
Write-Host "   Email 4: SANS sujet" -ForegroundColor Yellow
Write-Host "   -> Accepte: OUI" -ForegroundColor Green
Write-Host "   -> Attention requise: $($response4.requiresAttention)" -ForegroundColor Red
Write-Host "   -> Flags: $($response4.validationFlags -join ', ')" -ForegroundColor Red

Write-Host ""
Start-Sleep -Seconds 1

# Consultation des alertes
Write-Host "[4/7] SYSTEME DE NOTIFICATIONS" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$unreadCount = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications/unread-count" -Method Get -Headers $headers
Write-Host "   $($unreadCount.count) notification(s) non lue(s)" -ForegroundColor Red

if ($unreadCount.count -gt 0) {
    $notifications = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications?unreadOnly=true" -Method Get -Headers $headers
    Write-Host ""
    
    foreach ($notif in $notifications | Select-Object -First 3) {
        Write-Host "   - $($notif.title)" -ForegroundColor White
        Write-Host "     Action: $($notif.actionRequired)" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host ""
Start-Sleep -Seconds 1

# Recherche
Write-Host "[5/7] RECHERCHE INTELLIGENTE" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$searchBody = @{
    text = "divorce"
} | ConvertTo-Json

$searchResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/search/events" -Method Post -Body $searchBody -Headers $headers
Write-Host "   Recherche: 'divorce'" -ForegroundColor White
Write-Host "   -> $($searchResponse.Count) resultat(s) trouve(s)" -ForegroundColor Green

Write-Host ""
Start-Sleep -Seconds 1

# Dossiers
Write-Host "[6/7] GESTION DES DOSSIERS" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$casesResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/cases" -Method Get -Headers $headers
Write-Host "   $($casesResponse.Count) dossier(s) actif(s)" -ForegroundColor Green
Write-Host ""

foreach ($case in $casesResponse | Select-Object -First 5) {
    Write-Host "   - $($case.title)" -ForegroundColor White
    Write-Host "     Cree le: $(([DateTime]$case.createdAt).ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
}

Write-Host ""
Start-Sleep -Seconds 1

# Statistiques
Write-Host "[7/7] STATISTIQUES & ANALYTICS" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

try {
    $perDay = Invoke-RestMethod -Uri "http://localhost:8080/api/stats/events-per-day" -Method Get -Headers $headers
    $byType = Invoke-RestMethod -Uri "http://localhost:8080/api/stats/events-by-type" -Method Get -Headers $headers
    
    $totalEvents = ($perDay | Measure-Object -Property count -Sum).Sum
    
    Write-Host "   Total emails: $totalEvents" -ForegroundColor Green
    Write-Host "   Jours actifs: $($perDay.Count)" -ForegroundColor Green
    Write-Host "   Types d'events: $($byType.Count)" -ForegroundColor Green
} catch {
    Write-Host "   Statistiques non disponibles" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   POINTS CLES DE LA DEMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. AUCUN EMAIL N'EST PERDU" -ForegroundColor Green
Write-Host "   - Tous les emails sont acceptes et stockes" -ForegroundColor White
Write-Host "   - Meme ceux avec anomalies (sans expediteur, sans sujet)" -ForegroundColor White
Write-Host ""
Write-Host "2. NOTIFICATIONS & ACTIONS" -ForegroundColor Green
Write-Host "   - Notification automatique pour chaque anomalie" -ForegroundColor White
Write-Host "   - L'utilisateur decide de l'action a prendre" -ForegroundColor White
Write-Host "   - Peut marquer comme lu ou resoudre avec notes" -ForegroundColor White
Write-Host ""
Write-Host "3. ORGANISATION AUTOMATIQUE" -ForegroundColor Green
Write-Host "   - Creation automatique de dossiers" -ForegroundColor White
Write-Host "   - Regroupement des emails par dossier" -ForegroundColor White
Write-Host "   - Detection des doublons" -ForegroundColor White
Write-Host ""
Write-Host "4. RECHERCHE PUISSANTE" -ForegroundColor Green
Write-Host "   - Recherche textuelle classique" -ForegroundColor White
Write-Host "   - Recherche semantique IA (similitude)" -ForegroundColor White
Write-Host "   - Retrouvez n'importe quel email instantanement" -ForegroundColor White
Write-Host ""
Write-Host "5. SECURITE & CONFORMITE" -ForegroundColor Green
Write-Host "   - Authentification JWT securisee" -ForegroundColor White
Write-Host "   - Audit trail complet de toutes les actions" -ForegroundColor White
Write-Host "   - Export des donnees (JSON/CSV)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Interface web disponible sur:" -ForegroundColor Yellow
Write-Host "http://localhost:8080/demo.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Identifiants de connexion:" -ForegroundColor Yellow
Write-Host "Email: $email" -ForegroundColor White
Write-Host "Mot de passe: $password" -ForegroundColor White
Write-Host ""
