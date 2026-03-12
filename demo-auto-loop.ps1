# Demo automatique MemoLib - Boucle complete
$apiUrl = "http://localhost:5078"
$token = $null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMO AUTOMATIQUE MEMOLIB - BOUCLE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour attendre
function Wait-Demo {
    param([int]$seconds = 2)
    Start-Sleep -Seconds $seconds
}

# Fonction pour afficher une etape
function Show-Step {
    param([string]$title, [string]$description)
    Write-Host ""
    Write-Host ">>> $title" -ForegroundColor Yellow
    Write-Host "    $description" -ForegroundColor Gray
    Wait-Demo 1
}

# ETAPE 1: Inscription
Show-Step "1. INSCRIPTION UTILISATEUR" "Creation compte avocat"
$registerBody = @{
    email = "demo.avocat@memolib.local"
    password = "SecurePass123!"
    name = "Maitre Dupont"
    role = "AVOCAT"
    plan = "CABINET"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$apiUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "    OK - Compte cree" -ForegroundColor Green
} catch {
    Write-Host "    INFO - Compte existe deja" -ForegroundColor Cyan
}

# ETAPE 2: Connexion
Show-Step "2. CONNEXION" "Authentification JWT"
$loginBody = @{
    email = "demo.avocat@memolib.local"
    password = "SecurePass123!"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.token
Write-Host "    OK - Token JWT obtenu" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# ETAPE 3: Creation clients
Show-Step "3. CREATION CLIENTS" "5 clients avec coordonnees"
$clients = @(
    @{ name = "Sophie Martin"; email = "sophie.martin@example.com"; phoneNumber = "+33 6 12 34 56 78"; address = "12 rue de la Paix, Paris" },
    @{ name = "Pierre Dubois"; email = "pierre.dubois@example.com"; phoneNumber = "+33 6 23 45 67 89"; address = "45 avenue Victor Hugo, Lyon" },
    @{ name = "Marie Lefebvre"; email = "marie.lefebvre@example.com"; phoneNumber = "+33 6 34 56 78 90"; address = "8 boulevard Haussmann, Marseille" },
    @{ name = "Jean Moreau"; email = "jean.moreau@example.com"; phoneNumber = "+33 6 45 67 89 01"; address = "23 rue Nationale, Lille" },
    @{ name = "Claire Bernard"; email = "claire.bernard@example.com"; phoneNumber = "+33 6 56 78 90 12"; address = "67 cours Lafayette, Toulouse" }
)

$clientIds = @()
foreach ($client in $clients) {
    try {
        $result = Invoke-RestMethod -Uri "$apiUrl/api/client" -Method Post -Body ($client | ConvertTo-Json) -Headers $headers
        $clientIds += $result.id
        Write-Host "    OK - $($client.name)" -ForegroundColor Green
    } catch {
        Write-Host "    INFO - $($client.name) existe" -ForegroundColor Cyan
    }
    Wait-Demo 0.5
}

# ETAPE 4: Ingestion emails
Show-Step "4. INGESTION EMAILS" "15 emails de differents types"
$emailTypes = @(
    @{ subject = "Divorce urgent"; body = "Je souhaite entamer une procedure de divorce"; type = "FAMILLE" },
    @{ subject = "Licenciement abusif"; body = "Mon employeur m'a licencie sans motif valable"; type = "TRAVAIL" },
    @{ subject = "Litige proprietaire"; body = "Conflit avec mon proprietaire sur les charges"; type = "IMMOBILIER" },
    @{ subject = "Succession complexe"; body = "Besoin d'aide pour succession familiale"; type = "FAMILLE" },
    @{ subject = "Contrat de travail"; body = "Verification de mon contrat de travail"; type = "TRAVAIL" }
)

$emailCount = 0
for ($i = 0; $i -lt 3; $i++) {
    foreach ($emailType in $emailTypes) {
        $clientEmail = $clients[$i % $clients.Count].email
        $emailBody = @{
            from = $clientEmail
            subject = $emailType.subject
            body = $emailType.body
            externalId = "DEMO-$($emailType.type)-$(Get-Date -Format 'yyyyMMddHHmmss')-$i"
            occurredAt = (Get-Date).ToString("o")
        } | ConvertTo-Json

        try {
            $result = Invoke-RestMethod -Uri "$apiUrl/api/ingest/email" -Method Post -Body $emailBody -Headers $headers
            $emailCount++
            Write-Host "    OK - Email $emailCount : $($emailType.subject)" -ForegroundColor Green
        } catch {
            Write-Host "    INFO - Email $emailCount deja ingere" -ForegroundColor Cyan
        }
        Wait-Demo 0.3
    }
}

# ETAPE 5: Liste dossiers
Show-Step "5. LISTE DOSSIERS" "Affichage dossiers crees automatiquement"
$cases = Invoke-RestMethod -Uri "$apiUrl/api/cases" -Method Get -Headers $headers
Write-Host "    OK - $($cases.Count) dossiers trouves" -ForegroundColor Green
foreach ($case in $cases | Select-Object -First 5) {
    Write-Host "       - $($case.title)" -ForegroundColor Cyan
}

# ETAPE 6: Recherche textuelle
Show-Step "6. RECHERCHE TEXTUELLE" "Recherche par mots-cles"
$searchBody = @{ text = "divorce"; limit = 10 } | ConvertTo-Json
$searchResults = Invoke-RestMethod -Uri "$apiUrl/api/search/events" -Method Post -Body $searchBody -Headers $headers
Write-Host "    OK - $($searchResults.Count) resultats pour 'divorce'" -ForegroundColor Green

# ETAPE 7: Timeline dossier
Show-Step "7. TIMELINE DOSSIER" "Historique complet d'un dossier"
if ($cases.Count -gt 0) {
    $firstCase = $cases[0]
    $timeline = Invoke-RestMethod -Uri "$apiUrl/api/cases/$($firstCase.id)/timeline" -Method Get -Headers $headers
    Write-Host "    OK - $($timeline.Count) evenements dans la timeline" -ForegroundColor Green
}

# ETAPE 8: Statistiques
Show-Step "8. STATISTIQUES" "Analytics et metriques"
$statsPerDay = Invoke-RestMethod -Uri "$apiUrl/api/stats/events-per-day" -Method Get -Headers $headers
$statsByType = Invoke-RestMethod -Uri "$apiUrl/api/stats/events-by-type" -Method Get -Headers $headers
Write-Host "    OK - $($statsPerDay.Count) jours d'activite" -ForegroundColor Green
Write-Host "    OK - $($statsByType.Count) types d'evenements" -ForegroundColor Green

# ETAPE 9: Dashboard
Show-Step "9. DASHBOARD COMPLET" "Vue d'ensemble intelligente"
$dashboard = Invoke-RestMethod -Uri "$apiUrl/api/dashboard/overview" -Method Get -Headers $headers
Write-Host "    OK - Dashboard charge" -ForegroundColor Green
Write-Host "       - Dossiers: $($dashboard.stats.totalCases)" -ForegroundColor Cyan
Write-Host "       - Clients: $($dashboard.stats.totalClients)" -ForegroundColor Cyan
Write-Host "       - Emails: $($dashboard.stats.totalEvents)" -ForegroundColor Cyan
Write-Host "       - Anomalies: $($dashboard.stats.eventsWithAnomalies)" -ForegroundColor Cyan

# ETAPE 10: Alertes
Show-Step "10. ALERTES" "Emails necessitant attention"
$alerts = Invoke-RestMethod -Uri "$apiUrl/api/alerts/requires-attention" -Method Get -Headers $headers
Write-Host "    OK - $($alerts.count) email(s) en alerte" -ForegroundColor Green

# ETAPE 11: Client detail
Show-Step "11. DETAIL CLIENT" "Vue 360 d'un client"
$clientList = Invoke-RestMethod -Uri "$apiUrl/api/client" -Method Get -Headers $headers
if ($clientList.Count -gt 0) {
    $firstClient = $clientList[0]
    $clientDetail = Invoke-RestMethod -Uri "$apiUrl/api/client/$($firstClient.id)/detail" -Method Get -Headers $headers
    Write-Host "    OK - Detail client: $($clientDetail.client.name)" -ForegroundColor Green
    Write-Host "       - Dossiers lies: $($clientDetail.summary.relatedCasesCount)" -ForegroundColor Cyan
    Write-Host "       - Evenements recents: $($clientDetail.summary.recentEventsCount)" -ForegroundColor Cyan
}

# ETAPE 12: Export
Show-Step "12. EXPORT DONNEES" "Export JSON complet"
$export = Invoke-RestMethod -Uri "$apiUrl/api/export/events-text" -Method Get -Headers $headers
Write-Host "    OK - $($export.Count) evenements exportes" -ForegroundColor Green

# RESUME FINAL
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEMO TERMINEE - RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fonctionnalites demontrees:" -ForegroundColor Yellow
Write-Host "  1. Authentification JWT" -ForegroundColor Green
Write-Host "  2. Gestion clients (5 crees)" -ForegroundColor Green
Write-Host "  3. Ingestion emails ($emailCount emails)" -ForegroundColor Green
Write-Host "  4. Creation auto dossiers" -ForegroundColor Green
Write-Host "  5. Recherche intelligente" -ForegroundColor Green
Write-Host "  6. Timeline complete" -ForegroundColor Green
Write-Host "  7. Statistiques avancees" -ForegroundColor Green
Write-Host "  8. Dashboard temps reel" -ForegroundColor Green
Write-Host "  9. Systeme d'alertes" -ForegroundColor Green
Write-Host " 10. Vue 360 client" -ForegroundColor Green
Write-Host " 11. Export donnees" -ForegroundColor Green
Write-Host " 12. Detection doublons" -ForegroundColor Green
Write-Host ""
Write-Host "Resultats:" -ForegroundColor Yellow
Write-Host "  - Clients: $($clientList.Count)" -ForegroundColor Cyan
Write-Host "  - Dossiers: $($cases.Count)" -ForegroundColor Cyan
Write-Host "  - Emails: $emailCount" -ForegroundColor Cyan
Write-Host "  - Alertes: $($alerts.count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo complete! Ouvrez http://localhost:5078/demo.html" -ForegroundColor Green
Write-Host ""
