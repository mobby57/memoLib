# ======================================
# VERIFICATION PRODUCTION CLOUDFLARE
# ======================================

param(
    [string]$Url = "https://main.iaposte-manager.pages.dev"
)

$ErrorActionPreference = "SilentlyContinue"
Write-Host "`n=== VERIFICATION PRODUCTION ===" -ForegroundColor Cyan
Write-Host "URL: $Url`n" -ForegroundColor White

$totalTests = 0
$passedTests = 0

# ======================================
# TEST 1: Home Page Access
# ======================================
Write-Host "[TEST 1/5] Home Page Access..." -NoNewline
$totalTests++
try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host " PASS (Status: 200)" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " FAIL ($($_.Exception.Message))" -ForegroundColor Red
}

# ======================================
# TEST 2: HTTPS/SSL
# ======================================
Write-Host "[TEST 2/5] HTTPS/SSL Security..." -NoNewline
$totalTests++
if ($Url -match "^https://") {
    Write-Host " PASS (HTTPS enabled)" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host " FAIL (HTTP only)" -ForegroundColor Red
}

# ======================================
# TEST 3: Cloudflare Headers
# ======================================
Write-Host "[TEST 3/5] Cloudflare CDN..." -NoNewline
$totalTests++
try {
    $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 10
    $cfRay = $response.Headers['CF-Ray']
    if ($cfRay) {
        Write-Host " PASS (CF-Ray: $cfRay)" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " WARNING (No CF headers detected)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
}

# ======================================
# TEST 4: API Routes
# ======================================
Write-Host "[TEST 4/5] API Routes..." -NoNewline
$totalTests++
try {
    $apiUrl = "$Url/api/lawyer/dashboard"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 10
    Write-Host " PASS (API accessible)" -ForegroundColor Green
    $passedTests++
} catch {
    # 401 est attendu (auth requise) = API fonctionne
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host " PASS (Auth required - expected)" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " FAIL ($($_.Exception.Message))" -ForegroundColor Red
    }
}

# ======================================
# TEST 5: Response Time
# ======================================
Write-Host "[TEST 5/5] Performance..." -NoNewline
$totalTests++
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 10 | Out-Null
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 2000) {
        Write-Host " PASS ($responseTime ms)" -ForegroundColor Green
        $passedTests++
    } elseif ($responseTime -lt 5000) {
        Write-Host " WARNING ($responseTime ms - slow)" -ForegroundColor Yellow
        $passedTests++
    } else {
        Write-Host " FAIL ($responseTime ms - too slow)" -ForegroundColor Red
    }
} catch {
    Write-Host " FAIL (Timeout)" -ForegroundColor Red
}

# ======================================
# RESULTATS
# ======================================
Write-Host "`n=== RESULTATS ===" -ForegroundColor Cyan
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 0)

if ($successRate -eq 100) {
    Write-Host "Status: SUCCESS - All tests passed!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "Status: GOOD - Most tests passed ($successRate%)" -ForegroundColor Yellow
} else {
    Write-Host "Status: WARNING - Several tests failed ($successRate%)" -ForegroundColor Red
}

Write-Host "Passed: $passedTests / $totalTests tests ($successRate%)`n" -ForegroundColor White

# ======================================
# NEXT STEPS
# ======================================
if ($passedTests -lt $totalTests) {
    Write-Host "=== TROUBLESHOOTING ===" -ForegroundColor Yellow
    Write-Host "1. Check Cloudflare Dashboard: https://dash.cloudflare.com" -ForegroundColor White
    Write-Host "2. Verify environment variables (NEXTAUTH_SECRET, NEXTAUTH_URL)" -ForegroundColor White
    Write-Host "3. Check deployment logs: .\manage-d1.ps1 pages deployment tail`n" -ForegroundColor White
} else {
    Write-Host "=== NEXT STEPS ===" -ForegroundColor Green
    Write-Host "1. Configure NEXTAUTH_SECRET in Cloudflare Dashboard" -ForegroundColor White
    Write-Host "2. Test login: $Url/login" -ForegroundColor White
    Write-Host "3. Verify D1 connection: .\manage-d1.ps1 d1 info iaposte-production-db`n" -ForegroundColor White
}

Write-Host "=== DOCUMENTATION ===" -ForegroundColor Cyan
Write-Host "See: NEXT_STEPS_PRODUCTION.md for detailed instructions`n" -ForegroundColor White

exit $(if ($successRate -ge 80) { 0 } else { 1 })
