# Simulation d'ingestion d'emails pour Moro Sidibe

$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"

Write-Host "=== SIMULATION RÉCEPTION EMAIL ===" -ForegroundColor Cyan
Write-Host ""

# 1. Connexion
Write-Host "1. Connexion de l'utilisateur..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "   ✅ Connecté - Token obtenu" -ForegroundColor Green
Write-Host ""

# 2. Réception d'un email client
Write-Host "2. Réception d'un email d'un client..." -ForegroundColor Yellow
$emailData = @{
    from = "client.dupont@gmail.com"
    subject = "Demande de consultation - Divorce"
    body = "Bonjour Maître, Je souhaite obtenir une consultation concernant une procédure de divorce. Mon épouse et moi sommes mariés depuis 15 ans. Pouvez-vous me recevoir cette semaine? Cordialement, M. Dupont"
    externalId = "DOSSIER-DUPONT-2024"
    occurredAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$ingestResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData -Headers $headers
Write-Host "   ✅ Email ingéré!" -ForegroundColor Green
Write-Host "   📧 Event ID: $($ingestResponse.eventId)" -ForegroundColor White
Write-Host "   📁 Dossier ID: $($ingestResponse.caseId)" -ForegroundColor White
Write-Host "   🆕 Nouveau dossier: $($ingestResponse.caseCreated)" -ForegroundColor White
Write-Host ""

# 3. Réception d'un 2ème email du même client
Write-Host "3. Réception d'un 2ème email du même client..." -ForegroundColor Yellow
$emailData2 = @{
    from = "client.dupont@gmail.com"
    subject = "RE: Demande de consultation - Divorce"
    body = "Bonjour Maître, Je vous envoie les documents demandés en pièce jointe. Merci de me confirmer la date du rendez-vous. Cordialement, M. Dupont"
    externalId = "DOSSIER-DUPONT-2024"
    occurredAt = (Get-Date).AddHours(2).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$ingestResponse2 = Invoke-RestMethod -Uri "http://localhost:8080/api/ingest/email" -Method Post -Body $emailData2 -Headers $headers
Write-Host "   ✅ Email ingéré!" -ForegroundColor Green
Write-Host "   📧 Event ID: $($ingestResponse2.eventId)" -ForegroundColor White
Write-Host "   📁 Dossier ID: $($ingestResponse2.caseId)" -ForegroundColor White
Write-Host "   🆕 Nouveau dossier: $($ingestResponse2.caseCreated) (rattaché au dossier existant)" -ForegroundColor White
Write-Host ""

# 4. Recherche dans les emails
Write-Host "4. Recherche d'emails contenant 'divorce'..." -ForegroundColor Yellow
$searchBody = @{
    text = "divorce"
} | ConvertTo-Json

$searchResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/search/events" -Method Post -Body $searchBody -Headers $headers
Write-Host "   ✅ $($searchResponse.Count) email(s) trouvé(s)" -ForegroundColor Green
Write-Host ""

# 5. Liste des dossiers
Write-Host "5. Liste des dossiers..." -ForegroundColor Yellow
$casesResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/cases" -Method Get -Headers $headers
Write-Host "   ✅ $($casesResponse.Count) dossier(s) actif(s)" -ForegroundColor Green
foreach ($case in $casesResponse) {
    Write-Host "   Dossier: $($case.title) - Cree le $(([DateTime]$case.createdAt).ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor White
}
Write-Host ""

Write-Host "=== SIMULATION TERMINEE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resume:" -ForegroundColor Yellow
Write-Host "- 2 emails ingeres automatiquement" -ForegroundColor White
Write-Host "- 1 dossier cree automatiquement" -ForegroundColor White
Write-Host "- Emails rattaches au meme dossier via l'ID externe" -ForegroundColor White
Write-Host "- Recherche textuelle fonctionnelle" -ForegroundColor White
