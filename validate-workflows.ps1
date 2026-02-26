#!/usr/bin/env pwsh
# Validation des workflows critiques MemoLib

Write-Host "✅ Validation Workflows MemoLib" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    Write-Host "🔍 Test: $Name" -ForegroundColor Yellow
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "   ✅ $($response.StatusCode) - OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Health Check
Write-Host "`n📊 1. Health Check" -ForegroundColor Cyan
if (Test-Endpoint "API Health" "$baseUrl/api/health") { $passed++ } else { $failed++ }

# 2. Routes i18n
Write-Host "`n🌍 2. Routes i18n" -ForegroundColor Cyan
if (Test-Endpoint "Page d'accueil" "$baseUrl/") { $passed++ } else { $failed++ }
if (Test-Endpoint "Login FR" "$baseUrl/fr/login") { $passed++ } else { $failed++ }
if (Test-Endpoint "Login ES" "$baseUrl/es/login") { $passed++ } else { $failed++ }

# 3. API Endpoints
Write-Host "`n🔌 3. API Endpoints" -ForegroundColor Cyan
if (Test-Endpoint "Version API" "$baseUrl/api/version") { $passed++ } else { $failed++ }
if (Test-Endpoint "Dashboard Stats" "$baseUrl/api/dashboard/stats") { $passed++ } else { $failed++ }

# 4. Monitoring
Write-Host "`n📈 4. Monitoring" -ForegroundColor Cyan
if (Test-Endpoint "Métriques" "$baseUrl/api/dev/metrics") { $passed++ } else { $failed++ }

# 5. Database
Write-Host "`n🗄️  5. Database Connection" -ForegroundColor Cyan
try {
    $dbTest = npx prisma db execute --stdin <<< "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Connexion DB OK" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ Connexion DB échouée" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Erreur test DB: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Résumé
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ Tests réussis: $passed" -ForegroundColor Green
Write-Host "❌ Tests échoués: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n🎉 Tous les workflows sont opérationnels!" -ForegroundColor Green
    Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Tester le login manuel: $baseUrl/fr/login" -ForegroundColor White
    Write-Host "   2. Créer un dossier: $baseUrl/fr/admin/dossiers/nouveau" -ForegroundColor White
    Write-Host "   3. Configurer Fly.io: .\setup-fly.ps1" -ForegroundColor White
    exit 0
} else {
    Write-Host "`n⚠️  Certains workflows nécessitent attention" -ForegroundColor Yellow
    Write-Host "   Vérifiez que le serveur est démarré: npm run dev" -ForegroundColor White
    exit 1
}
