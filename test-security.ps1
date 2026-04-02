param(
    [string]$BaseUrl = 'http://localhost:5078',
    [switch]$Verbose
)

$ErrorActionPreference = 'Continue'

Write-Host "🔒 Test des protections de sécurité MemoLib" -ForegroundColor Cyan
Write-Host "URL de base: $BaseUrl" -ForegroundColor Gray
Write-Host ""

$results = @()

function Test-SecurityHeader {
    param($Url, $HeaderName, $ExpectedValue = $null)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing
        $headerValue = $response.Headers[$HeaderName]
        
        if ($headerValue) {
            if ($ExpectedValue -and $headerValue -notlike "*$ExpectedValue*") {
                return @{ Status = "FAIL"; Message = "En-tête $HeaderName présent mais valeur incorrecte: $headerValue" }
            }
            return @{ Status = "PASS"; Message = "En-tête $HeaderName présent: $headerValue" }
        } else {
            return @{ Status = "FAIL"; Message = "En-tête $HeaderName manquant" }
        }
    } catch {
        return @{ Status = "ERROR"; Message = "Erreur lors du test: $($_.Exception.Message)" }
    }
}

function Test-UrlValidation {
    param($TestUrl, $ShouldBeValid)
    
    try {
        $body = @{ Url = $TestUrl } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/security/validate-url" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.isValid -eq $ShouldBeValid) {
            return @{ Status = "PASS"; Message = "URL '$TestUrl' correctement validée: $($response.isValid)" }
        } else {
            return @{ Status = "FAIL"; Message = "URL '$TestUrl' mal validée. Attendu: $ShouldBeValid, Reçu: $($response.isValid)" }
        }
    } catch {
        return @{ Status = "ERROR"; Message = "Erreur validation URL '$TestUrl': $($_.Exception.Message)" }
    }
}

function Test-EmailValidation {
    param($TestEmail, $ShouldBeValid)
    
    try {
        $body = @{ Email = $TestEmail } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/security/validate-email" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.isValid -eq $ShouldBeValid) {
            return @{ Status = "PASS"; Message = "Email '$TestEmail' correctement validé: $($response.isValid)" }
        } else {
            return @{ Status = "FAIL"; Message = "Email '$TestEmail' mal validé. Attendu: $ShouldBeValid, Reçu: $($response.isValid)" }
        }
    } catch {
        return @{ Status = "ERROR"; Message = "Erreur validation email '$TestEmail': $($_.Exception.Message)" }
    }
}

function Test-CSRFProtection {
    try {
        # Test sans token CSRF
        $body = @{ email = "test@test.com"; password = "test123" } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        
        if ($response.StatusCode -eq 403 -or $response.StatusCode -eq 400) {
            return @{ Status = "PASS"; Message = "Protection CSRF active - requête sans token rejetée" }
        } else {
            return @{ Status = "FAIL"; Message = "Protection CSRF faible - requête sans token acceptée" }
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403 -or $_.Exception.Response.StatusCode -eq 400) {
            return @{ Status = "PASS"; Message = "Protection CSRF active - requête sans token rejetée" }
        }
        return @{ Status = "ERROR"; Message = "Erreur test CSRF: $($_.Exception.Message)" }
    }
}

function Show-Result {
    param($TestName, $Result)
    
    $color = switch ($Result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "ERROR" { "Yellow" }
        default { "Gray" }
    }
    
    $icon = switch ($Result.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "ERROR" { "⚠️" }
        default { "ℹ️" }
    }
    
    Write-Host "$icon $TestName" -ForegroundColor $color
    if ($Verbose -or $Result.Status -ne "PASS") {
        Write-Host "   $($Result.Message)" -ForegroundColor Gray
    }
    Write-Host ""
    
    $global:results += @{
        Test = $TestName
        Status = $Result.Status
        Message = $Result.Message
    }
}

# Tests des en-têtes de sécurité
Write-Host "🛡️ Test des en-têtes de sécurité" -ForegroundColor Yellow

Show-Result "X-Frame-Options" (Test-SecurityHeader "$BaseUrl/demo-secure.html" "X-Frame-Options" "DENY")
Show-Result "X-Content-Type-Options" (Test-SecurityHeader "$BaseUrl/demo-secure.html" "X-Content-Type-Options" "nosniff")
Show-Result "X-XSS-Protection" (Test-SecurityHeader "$BaseUrl/demo-secure.html" "X-XSS-Protection" "1; mode=block")
Show-Result "Referrer-Policy" (Test-SecurityHeader "$BaseUrl/demo-secure.html" "Referrer-Policy" "strict-origin-when-cross-origin")
Show-Result "Content-Security-Policy" (Test-SecurityHeader "$BaseUrl/demo-secure.html" "Content-Security-Policy" "default-src 'self'")

# Tests de validation d'URL
Write-Host "🔗 Test de validation des URLs" -ForegroundColor Yellow

# URLs qui devraient être valides
Show-Result "URL locale valide" (Test-UrlValidation "http://localhost:5078/api/test" $true)
Show-Result "URL relative valide" (Test-UrlValidation "/api/test" $true)
Show-Result "URL 127.0.0.1 valide" (Test-UrlValidation "http://127.0.0.1:5078/test" $true)

# URLs qui devraient être invalides
Show-Result "URL JavaScript bloquee" (Test-UrlValidation "javascript:alert(1)" $false)
Show-Result "URL Data bloquee" (Test-UrlValidation "data:text/html,alert(1)" $false)
Show-Result "URL externe bloquee" (Test-UrlValidation "http://malicious-site.com/phishing" $false)
Show-Result "URL FTP bloquee" (Test-UrlValidation "ftp://malicious-site.com/file" $false)

# Tests de validation d'email
Write-Host "📧 Test de validation des emails" -ForegroundColor Yellow

# Emails valides
Show-Result "Email valide standard" (Test-EmailValidation "user@example.com" $true)
Show-Result "Email valide avec sous-domaine" (Test-EmailValidation "test@mail.example.com" $true)

# Emails invalides
Show-Result "Email invalide sans @" (Test-EmailValidation "invalid-email" $false)
Show-Result "Email invalide sans domaine" (Test-EmailValidation "user@" $false)
Show-Result "Email avec caractères dangereux" (Test-EmailValidation "user<script>@example.com" $false)

# Test de protection CSRF
Write-Host "🛡️ Test de protection CSRF" -ForegroundColor Yellow
Show-Result "Protection CSRF" (Test-CSRFProtection)

# Test des fichiers sécurisés
Write-Host "📄 Test des fichiers sécurisés" -ForegroundColor Yellow

try {
    $secureDemo = Invoke-WebRequest -Uri "$BaseUrl/demo-secure.html" -UseBasicParsing
    if ($secureDemo.Content -like "*rel=`"noopener noreferrer`"*") {
        Show-Result "demo-secure.html" @{ Status = "PASS"; Message = "Fichier sécurisé présent avec protections tabnabbing" }
    } else {
        Show-Result "demo-secure.html" @{ Status = "FAIL"; Message = "Fichier présent mais protections manquantes" }
    }
} catch {
    Show-Result "demo-secure.html" @{ Status = "FAIL"; Message = "Fichier sécurisé non accessible" }
}

try {
    $secureContact = Invoke-WebRequest -Uri "$BaseUrl/contact-secure.html" -UseBasicParsing
    if ($secureContact.Content -like "*csrf_token*") {
        Show-Result "contact-secure.html" @{ Status = "PASS"; Message = "Formulaire sécurisé présent avec protection CSRF" }
    } else {
        Show-Result "contact-secure.html" @{ Status = "FAIL"; Message = "Formulaire présent mais protection CSRF manquante" }
    }
} catch {
    Show-Result "contact-secure.html" @{ Status = "FAIL"; Message = "Formulaire sécurisé non accessible" }
}

# Résumé des résultats
Write-Host "📊 Résumé des tests de sécurité" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($results | Where-Object { $_.Status -eq "ERROR" }).Count
$totalCount = $results.Count

Write-Host "✅ Tests réussis: $passCount" -ForegroundColor Green
Write-Host "❌ Tests échoués: $failCount" -ForegroundColor Red
Write-Host "⚠️ Erreurs: $errorCount" -ForegroundColor Yellow
Write-Host "📊 Total: $totalCount" -ForegroundColor Gray
Write-Host ""

$successRate = [math]::Round(($passCount / $totalCount) * 100, 1)
Write-Host "🎯 Taux de réussite: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "❌ Tests échoués:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "   • $($_.Test): $($_.Message)" -ForegroundColor Red
    }
}

if ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️ Erreurs rencontrées:" -ForegroundColor Yellow
    $results | Where-Object { $_.Status -eq "ERROR" } | ForEach-Object {
        Write-Host "   • $($_.Test): $($_.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($successRate -ge 80) {
    Write-Host "🔒 MemoLib est bien protégé contre le phishing et le tabnabbing!" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "⚠️ MemoLib a des protections partielles. Vérifiez les échecs ci-dessus." -ForegroundColor Yellow
} else {
    Write-Host "❌ MemoLib nécessite des améliorations de sécurité importantes!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pour plus d'informations, consultez SECURITY_GUIDE.md" -ForegroundColor Gray