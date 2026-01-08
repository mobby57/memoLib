# Script de Test Production Cloudflare Pages
# Test l'application déployée sur https://main.iaposte-manager.pages.dev

param(
    [string]$BaseUrl = "https://main.iaposte-manager.pages.dev"
)

Write-Host "`n🧪 TEST DE PRODUCTION - IA Poste Manager`n" -ForegroundColor Cyan

# Fonction pour tester une URL
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [int]$ExpectedStatus = 200
    )
    
    try {
        Write-Host "Testing $Name..." -NoNewline -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✅ OK ($($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ⚠️  Status: $($response.StatusCode) (Expected: $ExpectedStatus)" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Fonction pour tester un endpoint API
function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Name
    )
    
    try {
        Write-Host "Testing API $Name..." -NoNewline -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10 -ErrorAction Stop
        
        Write-Host " ✅ OK - Response received" -ForegroundColor Green
        return $true
    }
    catch {
        # Les endpoints API peuvent retourner 401 si non authentifié (c'est normal)
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host " ✅ OK (401 Unauthorized - Auth required)" -ForegroundColor Green
            return $true
        }
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Tests
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor White

$results = @{
    Total = 0
    Passed = 0
    Failed = 0
}

# Test 1: Page d'accueil
Write-Host "📄 PAGES:" -ForegroundColor Cyan
$results.Total++
if (Test-Endpoint "$BaseUrl/" "Home Page") { $results.Passed++ } else { $results.Failed++ }

$results.Total++
if (Test-Endpoint "$BaseUrl/lawyer/emails" "Lawyer Emails Page" 307) { $results.Passed++ } else { $results.Failed++ }

# Test 2: API Routes
Write-Host "`n🔌 API ROUTES:" -ForegroundColor Cyan
$results.Total++
if (Test-ApiEndpoint "$BaseUrl/api/lawyer/dashboard" "Lawyer Dashboard API") { $results.Passed++ } else { $results.Failed++ }

$results.Total++
if (Test-ApiEndpoint "$BaseUrl/api/lawyer/emails" "Lawyer Emails API") { $results.Passed++ } else { $results.Failed++ }

# Test 3: Static files
Write-Host "`n📦 STATIC FILES:" -ForegroundColor Cyan
$results.Total++
if (Test-Endpoint "$BaseUrl/_next/static/css/app/layout.css" "CSS Bundle" 404) { $results.Passed++ } else { $results.Failed++ }

# Test 4: Cloudflare Headers
Write-Host "`n☁️  CLOUDFLARE:" -ForegroundColor Cyan
try {
    Write-Host "Checking Cloudflare headers..." -NoNewline -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri $BaseUrl -Method Head -UseBasicParsing -ErrorAction Stop
    
    $cfHeaders = @(
        'CF-Ray',
        'CF-Cache-Status',
        'Server'
    )
    
    $cfDetected = $false
    foreach ($header in $cfHeaders) {
        if ($response.Headers[$header]) {
            $cfDetected = $true
            break
        }
    }
    
    if ($cfDetected) {
        Write-Host " ✅ Cloudflare detected" -ForegroundColor Green
        if ($response.Headers['CF-Ray']) {
            Write-Host "   CF-Ray: $($response.Headers['CF-Ray'])" -ForegroundColor Gray
        }
        if ($response.Headers['CF-Cache-Status']) {
            Write-Host "   Cache: $($response.Headers['CF-Cache-Status'])" -ForegroundColor Gray
        }
    } else {
        Write-Host " ⚠️  Cloudflare headers not found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host " ❌ FAILED" -ForegroundColor Red
}

# Test 5: SSL/TLS
Write-Host "`n🔒 SSL/TLS:" -ForegroundColor Cyan
Write-Host "Checking HTTPS..." -NoNewline -ForegroundColor Gray
if ($BaseUrl.StartsWith("https://")) {
    Write-Host " ✅ HTTPS enabled" -ForegroundColor Green
} else {
    Write-Host " ❌ HTTPS not enabled" -ForegroundColor Red
}

# Test 6: Response Time
Write-Host "`n⚡ PERFORMANCE:" -ForegroundColor Cyan
Write-Host "Measuring response time..." -NoNewline -ForegroundColor Gray
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Invoke-WebRequest -Uri $BaseUrl -Method Head -UseBasicParsing -ErrorAction Stop | Out-Null
    $stopwatch.Stop()
    $ms = $stopwatch.ElapsedMilliseconds
    
    if ($ms -lt 500) {
        Write-Host " ✅ $ms ms (Excellent)" -ForegroundColor Green
    } elseif ($ms -lt 1000) {
        Write-Host " ✅ $ms ms (Good)" -ForegroundColor Yellow
    } else {
        Write-Host " ⚠️  $ms ms (Slow)" -ForegroundColor Yellow
    }
}
catch {
    $stopwatch.Stop()
    Write-Host " ❌ FAILED" -ForegroundColor Red
}

# Résumé
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host " 📊 RÉSUMÉ DES TESTS" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Total: $($results.Total) tests" -ForegroundColor White
Write-Host " ✅ Passed: $($results.Passed)" -ForegroundColor Green
Write-Host " ❌ Failed: $($results.Failed)" -ForegroundColor Red

$successRate = [math]::Round(($results.Passed / $results.Total) * 100, 2)
if ($successRate -ge 80) {
    Write-Host " 📈 Success Rate: $successRate%" -ForegroundColor Green
} else {
    Write-Host " 📈 Success Rate: $successRate%" -ForegroundColor Yellow
}

if ($results.Failed -eq 0) {
    Write-Host "`n🎉 Tous les tests ont réussi!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Certains tests ont échoué. Vérifiez la configuration." -ForegroundColor Yellow
}

Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Retourner le taux de succès
exit $(if ($results.Failed -eq 0) { 0 } else { 1 })
