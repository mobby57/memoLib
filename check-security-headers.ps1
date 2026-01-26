# Verification complete des headers de securite
# IA Poste Manager - Production

$url = "https://iapostemanager-mobby57s-projects.vercel.app"

Write-Output ""
Write-Output "========================================"
Write-Output " AUDIT SECURITE - HEADERS HTTP"
Write-Output "========================================"
Write-Output ""

try {
    $response = Invoke-WebRequest -Uri $url -Method Head -SkipHttpErrorCheck
    
    Write-Output "[INFO] Status: $($response.StatusCode)"
    if ($response.StatusCode -eq 401) {
        Write-Output "   (Normal - Auth requise)"
    }
    
    Write-Output ""
    Write-Output "[INFO] HEADERS DE SECURITE:"
    Write-Output ""
    
    # Headers critiques a verifier
    $securityChecks = @(
        @{
            Header = 'Strict-Transport-Security'
            Name = 'HSTS (Force HTTPS)'
            Critical = $true
            Recommendation = 'max-age=63072000; includeSubDomains; preload'
        },
        @{
            Header = 'Content-Security-Policy'
            Name = 'CSP (Protection XSS)'
            Critical = $true
            Recommendation = "default-src 'self'; script-src 'self' 'unsafe-eval'"
        },
        @{
            Header = 'X-Frame-Options'
            Name = 'Clickjacking Protection'
            Critical = $true
            Recommendation = 'DENY ou SAMEORIGIN'
        },
        @{
            Header = 'X-Content-Type-Options'
            Name = 'MIME Sniffing Protection'
            Critical = $true
            Recommendation = 'nosniff'
        },
        @{
            Header = 'Referrer-Policy'
            Name = 'Referrer Control'
            Critical = $false
            Recommendation = 'strict-origin-when-cross-origin'
        },
        @{
            Header = 'Permissions-Policy'
            Name = 'Browser Permissions'
            Critical = $false
            Recommendation = "geolocation=(), microphone=(), camera=()"
        },
        @{
            Header = 'X-XSS-Protection'
            Name = 'XSS Filter (Legacy)'
            Critical = $false
            Recommendation = '1; mode=block'
        }
    )
    
    $score = 0
    $total = $securityChecks.Count
    
    foreach ($check in $securityChecks) {
        $headerValue = $response.Headers[$check.Header]
        
        if ($headerValue) {
            $score++
            $status = "[OK]"
            if ($check.Critical) {
                Write-Output "   $status $($check.Name)"
            } else {
                Write-Output "   $status $($check.Name)"
            }
            Write-Output "       Valeur: $headerValue"
        } else {
            if ($check.Critical) {
                Write-Output "   [CRITIQUE] $($check.Name) MANQUANT!"
            } else {
                Write-Output "   [WARN] $($check.Name) manquant"
            }
            Write-Output "       Recommande: $($check.Recommendation)"
        }
        Write-Output ""
    }
    
    Write-Output "========================================"
    Write-Output " SCORE: $score/$total"
    Write-Output "========================================"
    
    if ($score -eq $total) {
        Write-Output "[OK] Excellent! Tous les headers sont configures."
    } elseif ($score -ge ($total / 2)) {
        Write-Output "[WARN] Bien, mais certains headers manquent."
    } else {
        Write-Output "[CRITIQUE] Securite insuffisante!"
    }
    
} catch {
    Write-Output "[ERREUR] Impossible de contacter $url"
    Write-Output "   $($_.Exception.Message)"
}

Write-Output ""
