# Audit Securite Headers HTTP
$url = "https://memoLib-mobby57s-projects.vercel.app"

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "AUDIT SECURITE - HEADERS HTTP" -ForegroundColor White
Write-Host "`n===========================================`n" -ForegroundColor Cyan

$response = Invoke-WebRequest -Uri $url -Method Head -SkipHttpErrorCheck

Write-Host "Status: $($response.StatusCode)`n" -ForegroundColor Yellow

$checks = @{
    'Strict-Transport-Security' = 'HSTS'
    'Content-Security-Policy' = 'CSP'
    'X-Frame-Options' = 'X-Frame'
    'X-Content-Type-Options' = 'X-Content-Type'
    'Referrer-Policy' = 'Referrer'
    'Permissions-Policy' = 'Permissions'
}

$score = 0
$total = $checks.Count

Write-Host "HEADERS DE SECURITE:" -ForegroundColor Cyan
Write-Host ""

foreach ($header in $checks.GetEnumerator()) {
    $value = $response.Headers[$header.Key]
    if ($value) {
        Write-Host "  OK   $($header.Value): $value" -ForegroundColor Green
        $score++
    } else {
        Write-Host "  KO   $($header.Value): ABSENT" -ForegroundColor Red
    }
}

$percent = [math]::Round(($score / $total) * 10, 1)

Write-Host "`n===========================================`n" -ForegroundColor Cyan
Write-Host "SCORE: $percent/10 ($score/$total headers)" -ForegroundColor $(if ($percent -ge 7) { 'Green' } else { 'Yellow' })
Write-Host "`n===========================================`n" -ForegroundColor Cyan

# Cookies
if ($response.Headers['Set-Cookie']) {
    $cookie = $response.Headers['Set-Cookie']
    Write-Host "Cookies:" -ForegroundColor Cyan
    if ($cookie -match 'Secure' -and $cookie -match 'HttpOnly') {
        Write-Host "  OK   Secure + HttpOnly" -ForegroundColor Green
    } else {
        Write-Host "  KO   Flags manquants" -ForegroundColor Yellow
    }
}

Write-Host ""
