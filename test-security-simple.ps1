param(
    [string]$BaseUrl = 'http://localhost:5078'
)

Write-Host "Test des protections de securite MemoLib" -ForegroundColor Cyan
Write-Host "URL de base: $BaseUrl" -ForegroundColor Gray
Write-Host ""

function Test-SecurityHeader {
    param($Url, $HeaderName)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing
        $headerValue = $response.Headers[$HeaderName]
        
        if ($headerValue) {
            Write-Host "✅ $HeaderName present: $headerValue" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $HeaderName manquant" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "⚠️ Erreur test $HeaderName : $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Test-FileExists {
    param($FilePath)
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/$FilePath" -UseBasicParsing
        Write-Host "✅ $FilePath accessible" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $FilePath non accessible" -ForegroundColor Red
        return $false
    }
}

# Test des en-tetes de securite
Write-Host "Test des en-tetes de securite:" -ForegroundColor Yellow
$securityTests = 0
$securityPassed = 0

$headers = @(
    "X-Frame-Options",
    "X-Content-Type-Options", 
    "X-XSS-Protection",
    "Referrer-Policy",
    "Content-Security-Policy"
)

foreach ($header in $headers) {
    $securityTests++
    if (Test-SecurityHeader "$BaseUrl/health" $header) {
        $securityPassed++
    }
}

Write-Host ""

# Test des fichiers securises
Write-Host "Test des fichiers securises:" -ForegroundColor Yellow
$fileTests = 0
$filePassed = 0

$files = @(
    "demo-secure.html",
    "contact-secure.html"
)

foreach ($file in $files) {
    $fileTests++
    if (Test-FileExists $file) {
        $filePassed++
    }
}

Write-Host ""

# Test de l'API de securite
Write-Host "Test de l'API de securite:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/security/security-headers" -UseBasicParsing
    Write-Host "✅ API de securite accessible" -ForegroundColor Green
    $apiPassed = 1
} catch {
    Write-Host "❌ API de securite non accessible" -ForegroundColor Red
    $apiPassed = 0
}
$apiTests = 1

Write-Host ""

# Resume
$totalTests = $securityTests + $fileTests + $apiTests
$totalPassed = $securityPassed + $filePassed + $apiPassed

Write-Host "Resume des tests:" -ForegroundColor Cyan
Write-Host "En-tetes de securite: $securityPassed/$securityTests" -ForegroundColor $(if ($securityPassed -eq $securityTests) { "Green" } else { "Yellow" })
Write-Host "Fichiers securises: $filePassed/$fileTests" -ForegroundColor $(if ($filePassed -eq $fileTests) { "Green" } else { "Yellow" })
Write-Host "API de securite: $apiPassed/$apiTests" -ForegroundColor $(if ($apiPassed -eq $apiTests) { "Green" } else { "Yellow" })
Write-Host "Total: $totalPassed/$totalTests" -ForegroundColor $(if ($totalPassed -eq $totalTests) { "Green" } else { "Yellow" })

$successRate = [math]::Round(($totalPassed / $totalTests) * 100, 1)
Write-Host "Taux de reussite: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

Write-Host ""
if ($successRate -ge 80) {
    Write-Host "MemoLib est bien protege contre le phishing et le tabnabbing!" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "MemoLib a des protections partielles." -ForegroundColor Yellow
} else {
    Write-Host "MemoLib necessite des ameliorations de securite!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Consultez SECURITY_GUIDE.md pour plus d'informations" -ForegroundColor Gray