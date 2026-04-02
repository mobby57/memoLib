#!/usr/bin/env pwsh
# Script de test des routes i18n

Write-Host "🌍 Test des routes i18n MemoLib" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$routes = @(
    "/",
    "/fr",
    "/fr/login",
    "/fr/admin/dashboard",
    "/es",
    "/es/login",
    "/en",
    "/en/login",
    "/de"
)

$passed = 0
$failed = 0

foreach ($route in $routes) {
    $url = "$baseUrl$route"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $route : $($response.StatusCode)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "⚠️  $route : $($response.StatusCode)" -ForegroundColor Yellow
            $passed++
        }
    } catch {
        Write-Host "❌ $route : ERREUR - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ Réussis: $passed" -ForegroundColor Green
Write-Host "❌ Échoués: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n🎉 Tous les tests sont passés!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Certains tests ont échoué" -ForegroundColor Yellow
    exit 1
}
