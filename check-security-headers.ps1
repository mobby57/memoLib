# Vérification complète des headers de sécurité
# IA Poste Manager - Production

$url = "https://iapostemanager-mobby57s-projects.vercel.app"

Write-Host "`n" -NoNewline
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " 🔒 AUDIT SÉCURITÉ - HEADERS HTTP" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method Head -SkipHttpErrorCheck
    
    Write-Host "📊 Status: " -ForegroundColor Yellow -NoNewline
    if ($response.StatusCode -eq 401) {
        Write-Host "$($response.StatusCode) Unauthorized (Normal - Auth requise)" -ForegroundColor Green
    } else {
        Write-Host "$($response.StatusCode) $($response.StatusDescription)" -ForegroundColor White
    }
    
    Write-Host "`n🔍 HEADERS DE SÉCURITÉ:`n" -ForegroundColor Cyan
    
    # Headers critiques à vérifier
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
            Name = 'Legacy XSS Protection'
            Critical = $false
            Recommendation = '1; mode=block'
        }
    )
    
    $score = 0
    $maxScore = 0
    $issues = @()
    
    foreach ($check in $securityChecks) {
        $headerValue = $response.Headers[$check.Header]
        
        if ($check.Critical) {
            $maxScore += 2
        } else {
            $maxScore += 1
        }
        
        if ($headerValue) {
            # Header présent
            if ($check.Critical) {
                $score += 2
                Write-Host "  ✅ " -ForegroundColor Green -NoNewline
            } else {
                $score += 1
                Write-Host "  ✓  " -ForegroundColor Green -NoNewline
            }
            
            Write-Host "$($check.Name): " -ForegroundColor White -NoNewline
            Write-Host "$headerValue" -ForegroundColor Gray
            
        } else {
            # Header manquant
            if ($check.Critical) {
                Write-Host "  ❌ " -ForegroundColor Red -NoNewline
                $issues += @{
                    Severity = 'CRITIQUE'
                    Name = $check.Name
                    Header = $check.Header
                    Recommendation = $check.Recommendation
                }
            } else {
                Write-Host "  ⚠️  " -ForegroundColor Yellow -NoNewline
                $issues += @{
                    Severity = 'AVERTISSEMENT'
                    Name = $check.Name
                    Header = $check.Header
                    Recommendation = $check.Recommendation
                }
            }
            
            Write-Host "$($check.Name): " -ForegroundColor White -NoNewline
            Write-Host "ABSENT" -ForegroundColor Red
        }
    }
    
    # Calcul du score
    $percentage = [math]::Round(($score / $maxScore) * 10, 1)
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host " 📊 SCORE DE SÉCURITÉ: " -ForegroundColor White -NoNewline
    
    if ($percentage -ge 8) {
        Write-Host "$percentage/10 " -ForegroundColor Green -NoNewline
        Write-Host "EXCELLENT" -ForegroundColor Green
    } elseif ($percentage -ge 6) {
        Write-Host "$percentage/10 " -ForegroundColor Yellow -NoNewline
        Write-Host "BON" -ForegroundColor Yellow
    } elseif ($percentage -ge 4) {
        Write-Host "$percentage/10 " -ForegroundColor DarkYellow -NoNewline
        Write-Host "MOYEN" -ForegroundColor DarkYellow
    } else {
        Write-Host "$percentage/10 " -ForegroundColor Red -NoNewline
        Write-Host "FAIBLE" -ForegroundColor Red
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Afficher les problèmes
    if ($issues.Count -gt 0) {
        Write-Host "`n⚠️  PROBLÈMES DÉTECTÉS ($($issues.Count)):`n" -ForegroundColor Yellow
        
        $critiques = $issues | Where-Object { $_.Severity -eq 'CRITIQUE' }
        $warnings = $issues | Where-Object { $_.Severity -eq 'AVERTISSEMENT' }
        
        if ($critiques.Count -gt 0) {
            Write-Host "  🔴 CRITIQUES ($($critiques.Count)):" -ForegroundColor Red
            foreach ($issue in $critiques) {
                Write-Host "     • $($issue.Name) ($($issue.Header))" -ForegroundColor White
                Write-Host "       → Recommandé: $($issue.Recommendation)" -ForegroundColor Gray
            }
            Write-Host ""
        }
        
        if ($warnings.Count -gt 0) {
            Write-Host "  🟡 AVERTISSEMENTS ($($warnings.Count)):" -ForegroundColor Yellow
            foreach ($issue in $warnings) {
                Write-Host "     • $($issue.Name) ($($issue.Header))" -ForegroundColor White
                Write-Host "       → Recommandé: $($issue.Recommendation)" -ForegroundColor Gray
            }
        }
        
        # Instructions de correction
        Write-Host "`n📝 POUR CORRIGER:" -ForegroundColor Cyan
        Write-Host "   Ajoutez dans next.config.js les headers manquants" -ForegroundColor White
        Write-Host ""
        
        foreach ($issue in $critiques) {
            Write-Host "   { key: '$($issue.Header)', value: '$($issue.Recommendation)' }" -ForegroundColor Yellow
        }
        Write-Host ""
    } else {
        Write-Host "`n✅ AUCUN PROBLÈME DÉTECTÉ - SÉCURITÉ OPTIMALE!" -ForegroundColor Green
    }
    
    # Autres informations
    Write-Host "ℹ️  INFORMATIONS SUPPLÉMENTAIRES:`n" -ForegroundColor Cyan
    Write-Host "   Server: " -ForegroundColor Gray -NoNewline
    Write-Host $response.Headers['Server'] -ForegroundColor White
    
    Write-Host "   Date: " -ForegroundColor Gray -NoNewline
    Write-Host $response.Headers['Date'] -ForegroundColor White
    
    if ($response.Headers['Set-Cookie']) {
        Write-Host "   Cookies: " -ForegroundColor Gray -NoNewline
        $cookies = $response.Headers['Set-Cookie'] -split ';' | Select-Object -First 1
        Write-Host $cookies -ForegroundColor White
        
        # Vérifier les flags de sécurité des cookies
        if ($response.Headers['Set-Cookie'] -match 'Secure' -and $response.Headers['Set-Cookie'] -match 'HttpOnly') {
            Write-Host "   ✅ Cookies sécurisés (Secure + HttpOnly)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Cookies non sécurisés" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    # Générer rapport
    $reportPath = "SECURITY_HEADERS_REPORT.txt"
    $reportContent = @"
AUDIT SÉCURITÉ - HEADERS HTTP
================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
URL: $url
Status: $($response.StatusCode) $($response.StatusDescription)

SCORE: $percentage/10

HEADERS PRÉSENTS:
$($securityChecks | ForEach-Object {
    $val = $response.Headers[$_.Header]
    if ($val) { "✅ $($_.Header): $val" }
} | Out-String)

HEADERS MANQUANTS:
$($issues | ForEach-Object {
    "❌ $($_.Header) - $($_.Name)"
    "   Recommandé: $($_.Recommendation)"
} | Out-String)

ALL HEADERS:
$($response.Headers | Format-List | Out-String)
"@
    
    $reportContent | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "📄 Rapport sauvegardé: $reportPath" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Erreur lors de la vérification:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
