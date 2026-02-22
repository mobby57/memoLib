param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$Email = '',
    [string]$Password = 'StrongPass123!',
    [string]$ClientName = 'Client Demo'
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = "client.demo.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@memolib.local"
}

Write-Host '=== Demo client MemoLib ===' -ForegroundColor Cyan
Write-Host "URL: $BaseUrl"
Write-Host "Compte cible: $Email"
Write-Host ''

Write-Host '1) Creation du compte...' -ForegroundColor Yellow
$registerBody = @{
    email = $Email
    password = $Password
    name = $ClientName
    role = 'AVOCAT'
    plan = 'CABINET'
} | ConvertTo-Json

$registerStatus = 0
try {
    $registerResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $registerBody
    $registerStatus = $registerResponse.StatusCode
    Write-Host '   OK compte cree' -ForegroundColor Green
}
catch {
    $registerStatus = $_.Exception.Response.StatusCode.value__
    if ($registerStatus -eq 409) {
        Write-Host '   OK compte deja existant' -ForegroundColor Green
    }
    else {
        throw
    }
}

Write-Host '2) Connexion au compte...' -ForegroundColor Yellow
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body $loginBody
$token = $login.token
if ([string]::IsNullOrWhiteSpace($token)) {
    throw 'Token absent apres login.'
}
$headers = @{ Authorization = "Bearer $token" }
Write-Host '   OK connexion reussie' -ForegroundColor Green

Write-Host '3) Simulation envoi email...' -ForegroundColor Yellow
$externalId = "mail-demo-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$subject = 'Demande urgente dossier client'
$bodyText = 'Bonjour, merci de traiter ce dossier en priorite. Reunion demandee demain 10h.'

$ingestBody = @{
    externalId = $externalId
    from = 'contact@client-exemple.com'
    subject = $subject
    body = $bodyText
    occurredAt = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json

$ingest = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ingest/email" -Method POST -ContentType 'application/json' -Headers $headers -Body $ingestBody
if ($ingest.StatusCode -ne 200) {
    throw "Ingestion echouee: status $($ingest.StatusCode)"
}
Write-Host '   OK email recu et traite' -ForegroundColor Green

Write-Host '4) Verification via recherche...' -ForegroundColor Yellow
$searchBody = @{ text = 'dossier en priorite' } | ConvertTo-Json
$searchResults = Invoke-RestMethod -Uri "$BaseUrl/api/search/events" -Method POST -ContentType 'application/json' -Headers $headers -Body $searchBody
$foundEvent = $searchResults | Where-Object { $_.externalId -eq $externalId } | Select-Object -First 1
if (-not $foundEvent) {
    throw 'Email non retrouve dans la recherche.'
}
Write-Host '   OK email retrouve dans application' -ForegroundColor Green

Write-Host '5) Liaison a un dossier client...' -ForegroundColor Yellow
$caseId = Invoke-RestMethod -Uri "$BaseUrl/api/cases" -Method POST -ContentType 'application/json' -Headers $headers -Body (@{ title = 'Dossier demonstration client' } | ConvertTo-Json)
$attach = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/cases/$caseId/events/$($foundEvent.id)" -Method POST -Headers $headers
if ($attach.StatusCode -ne 200) {
    throw "Liaison dossier echouee: status $($attach.StatusCode)"
}
Write-Host '   OK email lie au dossier' -ForegroundColor Green

Write-Host '6) Controle timeline et audit...' -ForegroundColor Yellow
$timeline = Invoke-RestMethod -Uri "$BaseUrl/api/cases/$caseId/timeline" -Method GET -Headers $headers
$audit = Invoke-RestMethod -Uri "$BaseUrl/api/audit" -Method GET -Headers $headers
Write-Host '   OK timeline et audit disponibles' -ForegroundColor Green
Write-Host ''

$result = [pscustomobject]@{
    Status = 'PASS'
    BaseUrl = $BaseUrl
    DemoEmail = $Email
    RegisterStatus = $registerStatus
    LoginOk = $true
    SimulatedMailExternalId = $externalId
    SearchFound = $true
    CaseId = [string]$caseId
    TimelineItems = ($timeline | Measure-Object).Count
    AuditItems = ($audit | Measure-Object).Count
}

Write-Host '=== Resultat demo ===' -ForegroundColor Cyan
$result | ConvertTo-Json -Depth 4
