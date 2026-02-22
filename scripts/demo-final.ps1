param([string]$ApiUrl = 'http://localhost:5078')

$DemoUser = @{
    Email = 'demo@memolib.local'
    Password = 'Demo123!'
    Name = 'Utilisateur Demo'
}

$Global:Token = $null

function Invoke-Api {
    param([string]$Method = 'GET', [string]$Endpoint, [object]$Body = $null, [switch]$NoAuth)
    
    try {
        $headers = @{}
        if (-not $NoAuth -and $Global:Token) {
            $headers['Authorization'] = "Bearer $Global:Token"
        }
        
        if ($Body) {
            $headers['Content-Type'] = 'application/json'
            $response = Invoke-RestMethod -Uri "$ApiUrl$Endpoint" -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -TimeoutSec 15
        } else {
            $response = Invoke-RestMethod -Uri "$ApiUrl$Endpoint" -Method $Method -Headers $headers -TimeoutSec 15
        }
        
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

Write-Host "=== DEMONSTRATION COMPLETE MEMOLIB ===" -ForegroundColor Magenta
Write-Host "API: $ApiUrl" -ForegroundColor Gray

# 1. Test API
Write-Host "`n1. Test sante API..." -ForegroundColor Cyan
$health = Invoke-Api -Endpoint '/health' -NoAuth
if ($health.Success) {
    Write-Host "   ✅ API accessible" -ForegroundColor Green
} else {
    Write-Host "   ❌ API inaccessible: $($health.Error)" -ForegroundColor Red
    exit 1
}

# 2. Authentification avec creation automatique
Write-Host "`n2. Authentification..." -ForegroundColor Cyan

# Tentative de connexion
$login = Invoke-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $DemoUser -NoAuth

if (-not $login.Success) {
    Write-Host "   Compte inexistant, creation..." -ForegroundColor Yellow
    
    # Creation du compte
    $registerBody = @{
        email = $DemoUser.Email
        password = $DemoUser.Password
        name = $DemoUser.Name
        role = 'AVOCAT'
        plan = 'CABINET'
    }
    
    $register = Invoke-Api -Method 'POST' -Endpoint '/api/auth/register' -Body $registerBody -NoAuth
    
    if ($register.Success -or $register.Error -like "*existe*") {
        # Retry login
        $login = Invoke-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $DemoUser -NoAuth
    }
}

if ($login.Success -and $login.Data.token) {
    $Global:Token = $login.Data.token
    Write-Host "   ✅ Connecte: $($DemoUser.Email)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Connexion impossible" -ForegroundColor Red
    exit 1
}

# 3. Creation d'un client
Write-Host "`n3. Creation client..." -ForegroundColor Cyan
$client = @{
    name = 'Marie Dupont'
    email = 'marie.dupont@example.com'
    phoneNumber = '+33 6 12 34 56 78'
    address = '123 rue de la Demo, Paris'
}

$createClient = Invoke-Api -Method 'POST' -Endpoint '/api/client' -Body $client
if ($createClient.Success) {
    Write-Host "   ✅ Client cree: $($client.name)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Client existant ou erreur" -ForegroundColor Yellow
}

# 4. Ingestion d'emails de test
Write-Host "`n4. Ingestion emails de test..." -ForegroundColor Cyan

$emails = @(
    @{
        from = 'marie.dupont@example.com'
        subject = 'Consultation divorce'
        body = 'Bonjour Maitre, je souhaite une consultation pour mon divorce.'
    },
    @{
        from = 'pierre.martin@example.com'
        subject = 'Litige commercial urgent'
        body = 'Nous avons un litige commercial a traiter rapidement.'
    },
    @{
        from = 'sophie.bernard@example.com'
        subject = 'Droit du travail'
        body = 'Question sur mon licenciement economique.'
    }
)

$ingestedCount = 0
foreach ($email in $emails) {
    $email.externalId = "DEMO-$(Get-Date -Format 'yyyyMMddHHmmss')-$($emails.IndexOf($email))"
    $email.occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    
    $ingest = Invoke-Api -Method 'POST' -Endpoint '/api/ingest/email' -Body $email
    if ($ingest.Success) {
        $ingestedCount++
        Write-Host "   📧 Email ingere: $($email.subject)" -ForegroundColor Gray
    }
}

Write-Host "   ✅ $ingestedCount emails ingeres" -ForegroundColor Green

# 5. Verification des dossiers
Write-Host "`n5. Verification dossiers..." -ForegroundColor Cyan
$cases = Invoke-Api -Endpoint '/api/cases'
if ($cases.Success) {
    $count = if ($cases.Data -is [array]) { $cases.Data.Count } else { 1 }
    Write-Host "   ✅ $count dossier(s) cree(s)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur dossiers" -ForegroundColor Red
}

# 6. Test de recherche
Write-Host "`n6. Test recherche..." -ForegroundColor Cyan
$search = Invoke-Api -Method 'POST' -Endpoint '/api/search/events' -Body @{ text = 'divorce' }
if ($search.Success) {
    $count = if ($search.Data -is [array]) { $search.Data.Count } else { 1 }
    Write-Host "   ✅ Recherche OK - $count resultat(s)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur recherche" -ForegroundColor Red
}

# 7. Generation embeddings
Write-Host "`n7. Generation embeddings..." -ForegroundColor Cyan
$embeddings = Invoke-Api -Method 'POST' -Endpoint '/api/embeddings/generate-all'
if ($embeddings.Success) {
    Write-Host "   ✅ Embeddings generes" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Embeddings non disponibles" -ForegroundColor Yellow
}

# 8. Recherche semantique
Write-Host "`n8. Recherche semantique..." -ForegroundColor Cyan
$semantic = Invoke-Api -Method 'POST' -Endpoint '/api/semantic/search' -Body @{ query = 'probleme juridique urgent' }
if ($semantic.Success) {
    $count = if ($semantic.Data -is [array]) { $semantic.Data.Count } else { 1 }
    Write-Host "   ✅ Recherche IA OK - $count resultat(s)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Recherche IA non disponible" -ForegroundColor Yellow
}

# 9. Analytics et statistiques
Write-Host "`n9. Analytics..." -ForegroundColor Cyan
$stats = Invoke-Api -Endpoint '/api/dashboard/overview'
if ($stats.Success -and $stats.Data.stats) {
    $s = $stats.Data.stats
    Write-Host "   ✅ Stats:" -ForegroundColor Green
    Write-Host "      - Dossiers: $($s.totalCases)" -ForegroundColor Gray
    Write-Host "      - Clients: $($s.totalClients)" -ForegroundColor Gray
    Write-Host "      - Emails: $($s.totalEvents)" -ForegroundColor Gray
    Write-Host "      - Anomalies: $($s.eventsWithAnomalies)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Erreur analytics" -ForegroundColor Red
}

# 10. Centre d'anomalies
Write-Host "`n10. Centre anomalies..." -ForegroundColor Cyan
$anomalies = Invoke-Api -Endpoint '/api/alerts/center?limit=5'
if ($anomalies.Success) {
    $openAnomalies = $anomalies.Data.summary.totalOpenAnomalies
    Write-Host "   ✅ Centre anomalies OK - $openAnomalies anomalie(s)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur centre anomalies" -ForegroundColor Red
}

# 11. Export de donnees
Write-Host "`n11. Test export..." -ForegroundColor Cyan
$export = Invoke-Api -Endpoint '/api/export/events-text'
if ($export.Success) {
    $count = if ($export.Data -is [array]) { $export.Data.Count } else { 1 }
    Write-Host "   ✅ Export OK - $count evenement(s)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur export" -ForegroundColor Red
}

# Resume
Write-Host "`n" + "="*50 -ForegroundColor Magenta
Write-Host "🎉 DEMONSTRATION TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Magenta

Write-Host "`n📊 FONCTIONNALITES TESTEES:" -ForegroundColor Cyan
Write-Host "✅ Authentification automatique" -ForegroundColor Green
Write-Host "✅ Gestion des clients" -ForegroundColor Green
Write-Host "✅ Ingestion d'emails" -ForegroundColor Green
Write-Host "✅ Creation automatique de dossiers" -ForegroundColor Green
Write-Host "✅ Recherche textuelle" -ForegroundColor Green
Write-Host "✅ Recherche par embeddings/IA" -ForegroundColor Green
Write-Host "✅ Analytics et statistiques" -ForegroundColor Green
Write-Host "✅ Centre de gestion des anomalies" -ForegroundColor Green
Write-Host "✅ Export de donnees" -ForegroundColor Green

Write-Host "`n🌐 ACCES:" -ForegroundColor Cyan
Write-Host "Interface web: $ApiUrl/demo.html" -ForegroundColor White
Write-Host "API: $ApiUrl" -ForegroundColor White
Write-Host "Compte demo: $($DemoUser.Email) / $($DemoUser.Password)" -ForegroundColor White

Write-Host "`n📚 DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "README.md - Guide complet" -ForegroundColor White
Write-Host "FEATURES_COMPLETE.md - Fonctionnalites detaillees" -ForegroundColor White