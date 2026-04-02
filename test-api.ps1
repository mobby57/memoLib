# 🧪 Script de Test Automatique - MemoLib API
# Teste toutes les routes principales de l'API

param(
    [string]$BaseUrl = "http://localhost:5078",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Couleurs
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }

# Variables globales
$script:Token = $null
$script:CaseId = $null
$script:ClientId = $null
$script:EventId = $null
$script:TemplateId = $null
$script:WorkspaceToken = $null

$script:PassedTests = 0
$script:FailedTests = 0
$script:TotalTests = 0

# Fonction de test HTTP
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [bool]$RequireAuth = $true,
        [int]$ExpectedStatus = 200
    )

    $script:TotalTests++
    
    try {
        $uri = "$BaseUrl$Endpoint"
        
        if ($RequireAuth -and $script:Token) {
            $Headers["Authorization"] = "Bearer $script:Token"
        }
        
        $Headers["Content-Type"] = "application/json"
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        if ($Verbose) {
            Write-Info "Testing: $Name"
            Write-Host "  Method: $Method" -ForegroundColor Gray
            Write-Host "  URL: $uri" -ForegroundColor Gray
        }
        
        $response = Invoke-RestMethod @params
        $statusCode = 200
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "$Name - Status: $statusCode"
            $script:PassedTests++
            return $response
        } else {
            Write-Warning "$Name - Expected: $ExpectedStatus, Got: $statusCode"
            $script:FailedTests++
            return $null
        }
    }
    catch {
        Write-Error "$Name - Error: $($_.Exception.Message)"
        $script:FailedTests++
        return $null
    }
}

# Début des tests
Write-Host "`n[START] Demarrage des tests API MemoLib" -ForegroundColor Magenta
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Magenta

# ============================================
# 🔐 AUTHENTICATION
# ============================================
Write-Host "`n[AUTH] Tests Authentication" -ForegroundColor Yellow

# 1. Register
$registerData = @{
    email = "test-$(Get-Random)@memolib.com"
    password = "Test123!@#"
    name = "Maître Test"
    role = "AGENT"
    phone = "+33612345678"
    firmName = "Cabinet Test"
    plan = "CABINET"
}

$registerResult = Test-ApiEndpoint `
    -Name "Register User" `
    -Method "POST" `
    -Endpoint "/api/auth/register" `
    -Body $registerData `
    -RequireAuth $false `
    -ExpectedStatus 200

Start-Sleep -Milliseconds 500

# 2. Login
$loginData = @{
    email = $registerData.email
    password = $registerData.password
}

$loginResult = Test-ApiEndpoint `
    -Name "Login User" `
    -Method "POST" `
    -Endpoint "/api/auth/login" `
    -Body $loginData `
    -RequireAuth $false `
    -ExpectedStatus 200

if ($loginResult -and $loginResult.token) {
    $script:Token = $loginResult.token
    Write-Info "Token obtained: $($script:Token.Substring(0, 20))..."
}

# 3. Get Current User
Test-ApiEndpoint `
    -Name "Get Current User" `
    -Method "GET" `
    -Endpoint "/api/auth/me" `
    -ExpectedStatus 200

# ============================================
# 📁 CASE MANAGEMENT
# ============================================
Write-Host "`n[CASES] Tests Case Management" -ForegroundColor Yellow

# 4. Create Case
$caseData = @{
    title = "Dossier OQTF - Test $(Get-Random)"
    description = "OQTF notifiée avec délai de 30 jours"
    clientEmail = "client@test.com"
    clientName = "Client Test"
    clientPhone = "+33612345678"
    status = "OPEN"
    priority = 5
    tags = @("OQTF", "urgent")
    dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$caseResult = Test-ApiEndpoint `
    -Name "Create Case" `
    -Method "POST" `
    -Endpoint "/api/cases" `
    -Body $caseData `
    -ExpectedStatus 200

if ($caseResult -and $caseResult.id) {
    $script:CaseId = $caseResult.id
    Write-Info "Case created: $script:CaseId"
}

# 5. Get All Cases
Test-ApiEndpoint `
    -Name "Get All Cases" `
    -Method "GET" `
    -Endpoint "/api/cases" `
    -ExpectedStatus 200

# 6. Get Case by ID
if ($script:CaseId) {
    Test-ApiEndpoint `
        -Name "Get Case by ID" `
        -Method "GET" `
        -Endpoint "/api/cases/$script:CaseId" `
        -ExpectedStatus 200
}

# 7. Update Case Status
if ($script:CaseId) {
    $statusData = @{
        status = "IN_PROGRESS"
        comment = "Test status update"
    }
    
    Test-ApiEndpoint `
        -Name "Update Case Status" `
        -Method "PATCH" `
        -Endpoint "/api/cases/$script:CaseId/status" `
        -Body $statusData `
        -ExpectedStatus 200
}

# 8. Update Case Tags
if ($script:CaseId) {
    $tagsData = @{
        tags = @("OQTF", "urgent", "test")
        comment = "Test tags update"
    }
    
    Test-ApiEndpoint `
        -Name "Update Case Tags" `
        -Method "PATCH" `
        -Endpoint "/api/cases/$script:CaseId/tags" `
        -Body $tagsData `
        -ExpectedStatus 200
}

# ============================================
# 👥 CLIENT MANAGEMENT
# ============================================
Write-Host "`n[CLIENTS] Tests Client Management" -ForegroundColor Yellow

# 9. Create Client
$clientData = @{
    email = "client-$(Get-Random)@test.com"
    name = "Client Test"
    phone = "+33698765432"
    address = "123 Rue Test"
    city = "Paris"
    postalCode = "75001"
    notes = "Client de test"
}

$clientResult = Test-ApiEndpoint `
    -Name "Create Client" `
    -Method "POST" `
    -Endpoint "/api/client" `
    -Body $clientData `
    -ExpectedStatus 200

if ($clientResult -and $clientResult.id) {
    $script:ClientId = $clientResult.id
    Write-Info "Client created: $script:ClientId"
}

# 10. Get All Clients
Test-ApiEndpoint `
    -Name "Get All Clients" `
    -Method "GET" `
    -Endpoint "/api/client" `
    -ExpectedStatus 200

# 11. Get Client Detail
if ($script:ClientId) {
    Test-ApiEndpoint `
        -Name "Get Client Detail" `
        -Method "GET" `
        -Endpoint "/api/client/$script:ClientId/detail" `
        -ExpectedStatus 200
}

# ============================================
# 📧 EMAIL MANAGEMENT
# ============================================
Write-Host "`n[EMAIL] Tests Email Management" -ForegroundColor Yellow

# 12. Ingest Email
$emailData = @{
    from = "test@client.com"
    to = "avocat@cabinet.fr"
    subject = "Test Email - $(Get-Random)"
    body = "Ceci est un email de test"
    messageId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@test.local"
    receivedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$emailResult = Test-ApiEndpoint `
    -Name "Ingest Email" `
    -Method "POST" `
    -Endpoint "/api/ingest/email" `
    -Body $emailData `
    -ExpectedStatus 200

if ($emailResult -and $emailResult.eventId) {
    $script:EventId = $emailResult.eventId
    Write-Info "Event created: $script:EventId"
}

# 13. Create Email Template
$templateData = @{
    name = "Template Test $(Get-Random)"
    subject = "Test {{clientName}}"
    body = "Bonjour {{clientName}},\n\nCordialement"
    variables = @("clientName")
}

$templateResult = Test-ApiEndpoint `
    -Name "Create Email Template" `
    -Method "POST" `
    -Endpoint "/api/email/templates" `
    -Body $templateData `
    -ExpectedStatus 200

if ($templateResult -and $templateResult.id) {
    $script:TemplateId = $templateResult.id
}

# 14. Get All Templates
Test-ApiEndpoint `
    -Name "Get All Templates" `
    -Method "GET" `
    -Endpoint "/api/email/templates" `
    -ExpectedStatus 200

# ============================================
# 🔍 SEARCH
# ============================================
Write-Host "`n[SEARCH] Tests Search" -ForegroundColor Yellow

# 15. Text Search
$searchData = @{
    query = "test"
    limit = 10
}

Test-ApiEndpoint `
    -Name "Text Search" `
    -Method "POST" `
    -Endpoint "/api/search/events" `
    -Body $searchData `
    -ExpectedStatus 200

# ============================================
# 📊 DASHBOARD
# ============================================
Write-Host "`n[DASHBOARD] Tests Dashboard" -ForegroundColor Yellow

# 16. Get Dashboard Stats
Test-ApiEndpoint `
    -Name "Get Dashboard Stats" `
    -Method "GET" `
    -Endpoint "/api/dashboard/stats" `
    -ExpectedStatus 200

# ============================================
# 🔔 NOTIFICATIONS
# ============================================
Write-Host "`n[NOTIF] Tests Notifications" -ForegroundColor Yellow

# 17. Get Notifications
Test-ApiEndpoint `
    -Name "Get Notifications" `
    -Method "GET" `
    -Endpoint "/api/notifications" `
    -ExpectedStatus 200

# ============================================
# 📊 RÉSULTATS
# ============================================
Write-Host "`n" -NoNewline
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "[RESULTS] RESULTATS DES TESTS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

Write-Host "`nTotal tests: $script:TotalTests" -ForegroundColor White
Write-Success "Tests réussis: $script:PassedTests"
Write-Error "Tests échoués: $script:FailedTests"

$successRate = [math]::Round(($script:PassedTests / $script:TotalTests) * 100, 2)
Write-Host "`nTaux de réussite: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })

if ($script:FailedTests -eq 0) {
    Write-Host "`n[SUCCESS] Tous les tests sont passes avec succes!" -ForegroundColor Green
} else {
    Write-Host "`n[WARNING] Certains tests ont echoue. Verifiez les logs ci-dessus." -ForegroundColor Yellow
}

Write-Host "`n=========================================`n" -ForegroundColor Magenta

# Code de sortie
exit $script:FailedTests
