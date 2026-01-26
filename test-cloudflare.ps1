# Test Cloudflare Deployment
# IA Poste Manager

param(
    [string]$Url = "https://iapostemanage.pages.dev",
    [switch]$Verbose
)

Write-Output ""
Write-Output "========================================"
Write-Output "  TEST CLOUDFLARE DEPLOYMENT"
Write-Output "========================================"
Write-Output ""
Write-Output "URL: $Url"
Write-Output ""

$results = @{
    Total = 0
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Path,
        [int]$ExpectedStatus = 200,
        [string]$Contains = ""
    )
    
    $results.Total++
    $testUrl = "$Url$Path"
    
    try {
        $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            if ($Contains -and $response.Content -notlike "*$Contains*") {
                Write-Output "[WARN] $Name - Status OK mais contenu manquant"
                $results.Warnings++
            } else {
                Write-Output "[OK] $Name (HTTP $($response.StatusCode))"
                $results.Passed++
            }
        } else {
            Write-Output "[FAIL] $Name - Attendu: $ExpectedStatus, Recu: $($response.StatusCode)"
            $results.Failed++
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Output "[OK] $Name (HTTP $statusCode)"
            $results.Passed++
        } else {
            Write-Output "[FAIL] $Name - Erreur: $($_.Exception.Message)"
            $results.Failed++
        }
    }
}

# ========================================
# Tests principaux
# ========================================
Write-Output "[Tests Pages]"
Write-Output "----------------------------------------"

Test-Endpoint -Name "Page d'accueil" -Path "/" -ExpectedStatus 200
Test-Endpoint -Name "Page login" -Path "/auth/login" -ExpectedStatus 200
Test-Endpoint -Name "Page register" -Path "/auth/register" -ExpectedStatus 200

Write-Output ""
Write-Output "[Tests API]"
Write-Output "----------------------------------------"

Test-Endpoint -Name "API Health" -Path "/api/health" -ExpectedStatus 200
Test-Endpoint -Name "API Auth (non-auth)" -Path "/api/auth/session" -ExpectedStatus 200

Write-Output ""
Write-Output "[Tests Assets]"
Write-Output "----------------------------------------"

Test-Endpoint -Name "Favicon" -Path "/favicon.ico" -ExpectedStatus 200
Test-Endpoint -Name "Manifest" -Path "/manifest.json" -ExpectedStatus 200

Write-Output ""
Write-Output "[Tests Securite]"
Write-Output "----------------------------------------"

# Test headers de securite
try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
    $headers = $response.Headers
    
    $results.Total++
    if ($headers["X-Frame-Options"] -or $headers["Content-Security-Policy"]) {
        Write-Output "[OK] Headers de securite presents"
        $results.Passed++
    } else {
        Write-Output "[WARN] Headers de securite manquants"
        $results.Warnings++
    }
    
    $results.Total++
    if ($headers["Strict-Transport-Security"]) {
        Write-Output "[OK] HSTS active"
        $results.Passed++
    } else {
        Write-Output "[WARN] HSTS non configure"
        $results.Warnings++
    }
    
} catch {
    Write-Output "[WARN] Impossible de verifier les headers"
    $results.Warnings++
}

Write-Output ""
Write-Output "[Tests Performance]"
Write-Output "----------------------------------------"

# Test temps de reponse
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
    $stopwatch.Stop()
    
    $responseTime = $stopwatch.ElapsedMilliseconds
    $results.Total++
    
    if ($responseTime -lt 1000) {
        Write-Output "[OK] Temps de reponse: ${responseTime}ms (< 1s)"
        $results.Passed++
    } elseif ($responseTime -lt 3000) {
        Write-Output "[WARN] Temps de reponse: ${responseTime}ms (< 3s)"
        $results.Warnings++
    } else {
        Write-Output "[FAIL] Temps de reponse: ${responseTime}ms (> 3s)"
        $results.Failed++
    }
    
} catch {
    Write-Output "[FAIL] Timeout lors du test de performance"
    $results.Failed++
}

# ========================================
# Resume
# ========================================
Write-Output ""
Write-Output "========================================"
Write-Output "  RESULTATS"
Write-Output "========================================"
Write-Output ""
Write-Output "Total:     $($results.Total)"
Write-Output "Passes:    $($results.Passed)"
Write-Output "Echecs:    $($results.Failed)"
Write-Output "Warnings:  $($results.Warnings)"
Write-Output ""

$successRate = [math]::Round(($results.Passed / $results.Total) * 100, 1)
if ($results.Failed -eq 0) {
    Write-Output "[OK] Tous les tests critiques passes! ($successRate%)"
} else {
    Write-Output "[ATTENTION] $($results.Failed) test(s) echoue(s)"
}

Write-Output ""
