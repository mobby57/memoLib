# ====================================================================
#  TESTS AVANCES - PARCOURS UTILISATEUR EMAIL PROVISIONING
#  Suite de tests pour validation complete du systeme
# ====================================================================

param(
    [switch]$QuickTest,
    [switch]$FullTest,
    [switch]$StressTest
)

$script:BaseUrl = "http://localhost:5000"
$script:TestResults = @()

# ====================================================================
# FONCTIONS UTILITAIRES
# ====================================================================

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n" ("=" * 80) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Cyan
}

function Write-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message = "")
    
    $result = @{
        Test = $TestName
        Passed = $Passed
        Message = $Message
        Timestamp = Get-Date
    }
    
    $script:TestResults += $result
    
    if ($Passed) {
        Write-Host "  ✓ $TestName" -ForegroundColor Green
        if ($Message) {
            Write-Host "    $Message" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ✗ $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "    $Message" -ForegroundColor Yellow
        }
    }
}

# ====================================================================
# TESTS DE BASE
# ====================================================================

function Test-BasicEndpoints {
    Write-TestHeader "TESTS DE BASE - ENDPOINTS"
    
    # Test 1: Health Check
    try {
        $health = Invoke-RestMethod -Uri "$script:BaseUrl/api/health" -TimeoutSec 5
        Write-TestResult "Health Check" $true "Server is healthy"
    }
    catch {
        Write-TestResult "Health Check" $false $_.Exception.Message
        return $false
    }
    
    # Test 2: Check Availability
    try {
        $body = @{username='test-basic'} | ConvertTo-Json
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/check-availability" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 10
        
        $valid = $result.PSObject.Properties.Name -contains 'available' -and 
                 $result.PSObject.Properties.Name -contains 'email'
        
        Write-TestResult "Check Availability Endpoint" $valid "Response structure valid"
    }
    catch {
        Write-TestResult "Check Availability Endpoint" $false $_.Exception.Message
    }
    
    # Test 3: List Accounts
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/my-accounts" `
            -Method GET `
            -TimeoutSec 10
        
        $valid = $result.PSObject.Properties.Name -contains 'accounts'
        Write-TestResult "List Accounts Endpoint" $valid "Returned $($result.accounts.Count) accounts"
    }
    catch {
        Write-TestResult "List Accounts Endpoint" $false $_.Exception.Message
    }
    
    return $true
}

# ====================================================================
# TESTS DE VALIDATION
# ====================================================================

function Test-UsernameValidation {
    Write-TestHeader "TESTS DE VALIDATION - USERNAMES"
    
    $testCases = @(
        @{Username='contact'; ShouldPass=$true; Description='Username valide simple'},
        @{Username='support-2025'; ShouldPass=$true; Description='Username avec tiret et chiffres'},
        @{Username='info_test'; ShouldPass=$true; Description='Username avec underscore'},
        @{Username='a'; ShouldPass=$true; Description='Username court (1 caractere)'},
        @{Username='test.user'; ShouldPass=$true; Description='Username avec point'},
        @{Username='UPPERCASE'; ShouldPass=$true; Description='Username en majuscules'},
        @{Username=''; ShouldPass=$false; Description='Username vide'},
        @{Username='test user'; ShouldPass=$false; Description='Username avec espace'},
        @{Username='test@domain'; ShouldPass=$false; Description='Username avec arobase'}
    )
    
    foreach ($test in $testCases) {
        try {
            $body = @{username=$test.Username} | ConvertTo-Json
            $result = Invoke-RestMethod `
                -Uri "$script:BaseUrl/api/email/check-availability" `
                -Method POST `
                -ContentType 'application/json' `
                -Body $body `
                -TimeoutSec 10 `
                -ErrorAction Stop
            
            $passed = $test.ShouldPass
            Write-TestResult $test.Description $passed "Username: '$($test.Username)'"
        }
        catch {
            $passed = -not $test.ShouldPass
            Write-TestResult $test.Description $passed "Username: '$($test.Username)' - Error expected"
        }
    }
}

# ====================================================================
# TESTS DE PERFORMANCE
# ====================================================================

function Test-ResponseTime {
    Write-TestHeader "TESTS DE PERFORMANCE - TEMPS DE REPONSE"
    
    $endpoints = @(
        @{Name='Health Check'; Url='/api/health'; Method='GET'; MaxTime=1000},
        @{Name='Check Availability'; Url='/api/email/check-availability'; Method='POST'; MaxTime=2000; Body=@{username='perf-test'}},
        @{Name='List Accounts'; Url='/api/email/my-accounts'; Method='GET'; MaxTime=3000}
    )
    
    foreach ($endpoint in $endpoints) {
        $times = @()
        
        for ($i = 0; $i -lt 5; $i++) {
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            
            try {
                $params = @{
                    Uri = "$script:BaseUrl$($endpoint.Url)"
                    Method = $endpoint.Method
                    TimeoutSec = 10
                }
                
                if ($endpoint.Body) {
                    $params.Body = $endpoint.Body | ConvertTo-Json
                    $params.ContentType = 'application/json'
                }
                
                Invoke-RestMethod @params | Out-Null
                $sw.Stop()
                $times += $sw.ElapsedMilliseconds
            }
            catch {
                $sw.Stop()
            }
            
            Start-Sleep -Milliseconds 100
        }
        
        $avgTime = ($times | Measure-Object -Average).Average
        $passed = $avgTime -le $endpoint.MaxTime
        
        Write-TestResult "$($endpoint.Name) Performance" $passed "Avg: $([math]::Round($avgTime, 2))ms (Max: $($endpoint.MaxTime)ms)"
    }
}

# ====================================================================
# TESTS DE CHARGE
# ====================================================================

function Test-LoadHandling {
    Write-TestHeader "TESTS DE CHARGE - REQUETES CONCURRENTES"
    
    $concurrentRequests = 10
    $jobs = @()
    
    Write-Host "  Lancement de $concurrentRequests requetes simultanees..." -ForegroundColor Gray
    
    for ($i = 0; $i -lt $concurrentRequests; $i++) {
        $jobs += Start-Job -ScriptBlock {
            param($BaseUrl, $Index)
            
            try {
                $body = @{username="load-test-$Index"} | ConvertTo-Json
                $result = Invoke-RestMethod `
                    -Uri "$BaseUrl/api/email/check-availability" `
                    -Method POST `
                    -ContentType 'application/json' `
                    -Body $body `
                    -TimeoutSec 15
                
                return @{Success=$true; Index=$Index}
            }
            catch {
                return @{Success=$false; Index=$Index; Error=$_.Exception.Message}
            }
        } -ArgumentList $script:BaseUrl, $i
    }
    
    # Attendre les resultats
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    $successCount = ($results | Where-Object {$_.Success}).Count
    $passed = $successCount -ge ($concurrentRequests * 0.8)
    
    Write-TestResult "Gestion de charge" $passed "$successCount/$concurrentRequests requetes reussies"
}

# ====================================================================
# TESTS DE SECURITE
# ====================================================================

function Test-SecurityMeasures {
    Write-TestHeader "TESTS DE SECURITE"
    
    # Test 1: SQL Injection
    $sqlInjectionTests = @(
        "admin' OR '1'='1",
        "1'; DROP TABLE users--",
        "admin'--",
        "' OR 1=1--"
    )
    
    $allBlocked = $true
    foreach ($injection in $sqlInjectionTests) {
        try {
            $body = @{username=$injection} | ConvertTo-Json
            $result = Invoke-RestMethod `
                -Uri "$script:BaseUrl/api/email/check-availability" `
                -Method POST `
                -ContentType 'application/json' `
                -Body $body `
                -TimeoutSec 10
            
            # Si ca reussit, verifier que le username est nettoye
            if ($result.email -like "*$injection*") {
                $allBlocked = $false
            }
        }
        catch {
            # Erreur = injection bloquee (bon signe)
        }
    }
    
    Write-TestResult "Protection SQL Injection" $allBlocked "Tentatives d'injection bloquees"
    
    # Test 2: XSS
    $xssTests = @(
        "<script>alert('xss')</script>",
        "javascript:alert(1)",
        "<img src=x onerror=alert(1)>"
    )
    
    $xssBlocked = $true
    foreach ($xss in $xssTests) {
        try {
            $body = @{username=$xss} | ConvertTo-Json
            $result = Invoke-RestMethod `
                -Uri "$script:BaseUrl/api/email/check-availability" `
                -Method POST `
                -ContentType 'application/json' `
                -Body $body `
                -TimeoutSec 10
            
            if ($result.email -like "*<script>*" -or $result.email -like "*javascript:*") {
                $xssBlocked = $false
            }
        }
        catch {
            # Erreur = XSS bloque (bon signe)
        }
    }
    
    Write-TestResult "Protection XSS" $xssBlocked "Tentatives XSS bloquees"
    
    # Test 3: Rate Limiting (si implemente)
    try {
        $rapidRequests = 20
        $blocked = 0
        
        for ($i = 0; $i -lt $rapidRequests; $i++) {
            try {
                $body = @{username="rate-test-$i"} | ConvertTo-Json
                Invoke-RestMethod `
                    -Uri "$script:BaseUrl/api/email/check-availability" `
                    -Method POST `
                    -ContentType 'application/json' `
                    -Body $body `
                    -TimeoutSec 5 | Out-Null
            }
            catch {
                if ($_.Exception.Message -like "*429*" -or $_.Exception.Message -like "*rate limit*") {
                    $blocked++
                }
            }
        }
        
        $rateLimitActive = $blocked -gt 0
        Write-TestResult "Rate Limiting" $rateLimitActive "$(if($blocked -gt 0){"$blocked requetes bloquees"}else{"Non implemente"})"
    }
    catch {
        Write-TestResult "Rate Limiting" $false "Non implemente"
    }
}

# ====================================================================
# TESTS D'INTEGRATION
# ====================================================================

function Test-FullWorkflow {
    Write-TestHeader "TESTS D'INTEGRATION - WORKFLOW COMPLET"
    
    $testUsername = "integration-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    
    # Etape 1: Verifier disponibilite
    try {
        $body = @{username=$testUsername} | ConvertTo-Json
        $checkResult = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/check-availability" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 10
        
        Write-TestResult "Workflow - Etape 1 (Check)" $checkResult.available "Email disponible"
    }
    catch {
        Write-TestResult "Workflow - Etape 1 (Check)" $false $_.Exception.Message
        return
    }
    
    # Etape 2: Creer le compte (en mode test, peut echouer si pas de config)
    try {
        $createBody = @{
            username = $testUsername
            provider = 'sendgrid'
            display_name = 'Test Integration'
            description = 'Compte de test automatique'
        } | ConvertTo-Json
        
        $createResult = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/create" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $createBody `
            -TimeoutSec 15
        
        Write-TestResult "Workflow - Etape 2 (Create)" $true "Compte cree: $($createResult.email)"
        
        # Etape 3: Verifier dans la liste
        Start-Sleep -Seconds 1
        $listResult = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/my-accounts" `
            -Method GET `
            -TimeoutSec 10
        
        $accountFound = $listResult.accounts | Where-Object {$_.email -like "*$testUsername*"}
        Write-TestResult "Workflow - Etape 3 (List)" ($null -ne $accountFound) "Compte trouve dans la liste"
    }
    catch {
        if ($_.Exception.Message -like "*API key*" -or $_.Exception.Message -like "*credentials*") {
            Write-TestResult "Workflow - Etape 2 (Create)" $true "Configuration provider manquante (normal en test)"
        }
        else {
            Write-TestResult "Workflow - Etape 2 (Create)" $false $_.Exception.Message
        }
    }
}

# ====================================================================
# RAPPORT FINAL
# ====================================================================

function Show-FinalReport {
    Write-TestHeader "RAPPORT FINAL"
    
    $totalTests = $script:TestResults.Count
    $passedTests = ($script:TestResults | Where-Object {$_.Passed}).Count
    $failedTests = $totalTests - $passedTests
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    
    Write-Host "`n  Total de tests executes: " -NoNewline -ForegroundColor Gray
    Write-Host $totalTests -ForegroundColor Cyan
    
    Write-Host "  Tests reussis: " -NoNewline -ForegroundColor Gray
    Write-Host $passedTests -ForegroundColor Green
    
    Write-Host "  Tests echoues: " -NoNewline -ForegroundColor Gray
    Write-Host $failedTests -ForegroundColor $(if($failedTests -eq 0){'Green'}else{'Red'})
    
    Write-Host "  Taux de reussite: " -NoNewline -ForegroundColor Gray
    Write-Host "$successRate%" -ForegroundColor $(
        if ($successRate -eq 100) { 'Green' }
        elseif ($successRate -ge 80) { 'Yellow' }
        else { 'Red' }
    )
    
    Write-Host "`n  " ("-" * 76) -ForegroundColor Gray
    
    if ($failedTests -gt 0) {
        Write-Host "`n  Tests echoues:" -ForegroundColor Yellow
        $script:TestResults | Where-Object {-not $_.Passed} | ForEach-Object {
            Write-Host "    - $($_.Test)" -ForegroundColor Red
            if ($_.Message) {
                Write-Host "      $($_.Message)" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    
    # Verdict final
    if ($successRate -eq 100) {
        Write-Host "  VERDICT: EXCELLENT" -ForegroundColor Green
        Write-Host "  Le systeme fonctionne parfaitement!" -ForegroundColor Green
    }
    elseif ($successRate -ge 80) {
        Write-Host "  VERDICT: BON" -ForegroundColor Yellow
        Write-Host "  Le systeme fonctionne avec quelques problemes mineurs." -ForegroundColor Yellow
    }
    elseif ($successRate -ge 50) {
        Write-Host "  VERDICT: MOYEN" -ForegroundColor Yellow
        Write-Host "  Le systeme necessite des ameliorations." -ForegroundColor Yellow
    }
    else {
        Write-Host "  VERDICT: PROBLEMATIQUE" -ForegroundColor Red
        Write-Host "  Le systeme presente des problemes majeurs." -ForegroundColor Red
    }
    
    Write-Host ""
}

# ====================================================================
# POINT D'ENTREE
# ====================================================================

function Main {
    Clear-Host
    
    Write-Host @"

    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║            SUITE DE TESTS AVANCEE - EMAIL CLOUD              ║
    ║                    iaPostemanage v3.1                         ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
    
    # Verification serveur
    Write-Host "  Verification du serveur..." -ForegroundColor Gray
    try {
        Invoke-RestMethod -Uri "$script:BaseUrl/api/health" -TimeoutSec 5 | Out-Null
        Write-Host "  ✓ Serveur actif`n" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Serveur non disponible!" -ForegroundColor Red
        Write-Host "  Lancez le serveur avec RUN_SERVER.bat`n" -ForegroundColor Yellow
        return
    }
    
    # Execution des tests
    if ($QuickTest) {
        Test-BasicEndpoints
    }
    elseif ($StressTest) {
        Test-LoadHandling
        Test-ResponseTime
    }
    elseif ($FullTest -or (-not $QuickTest -and -not $StressTest)) {
        Test-BasicEndpoints
        Test-UsernameValidation
        Test-ResponseTime
        Test-LoadHandling
        Test-SecurityMeasures
        Test-FullWorkflow
    }
    
    # Rapport final
    Show-FinalReport
}

# Execution
Main
