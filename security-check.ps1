Write-Host "`n=========================================`n" -ForegroundColor Cyan
Write-Host "AUDIT SECURITE - HEADERS HTTP" -ForegroundColor White
Write-Host "`n=========================================`n" -ForegroundColor Cyan

$output = curl.exe -I https://iapostemanager-mobby57s-projects.vercel.app 2>&1 | Out-String

Write-Host $output

Write-Host "`n=========================================`n" -ForegroundColor Cyan
Write-Host "ANALYSE:" -ForegroundColor Yellow
Write-Host ""

$headers = @('Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy')

$score = 0
foreach ($h in $headers) {
    if ($output -match $h) {
        Write-Host "  OK   $h" -ForegroundColor Green
        $score++
    } else {
        Write-Host "  KO   $h MANQUANT" -ForegroundColor Red
    }
}

$percent = [math]::Round(($score / $headers.Count) * 10, 1)

Write-Host "`n=========================================`n" -ForegroundColor Cyan
Write-Host "SCORE: $percent/10 ($score/$($headers.Count) headers)" -ForegroundColor $(if ($percent -ge 7) { 'Green' } else { 'Yellow' })
Write-Host "`n=========================================`n" -ForegroundColor Cyan
