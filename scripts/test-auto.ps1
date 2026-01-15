# ============================================
# SCRIPT DE TEST AUTOMATIQUE - IA POSTE MANAGER
# ============================================
# Ce script teste :
# 1. Routes API (super-admin, admin, client)
# 2. Dashboards (accessibilité par rôle)
# 3. Limites plan
# 4. Isolation tenant

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "TEST AUTOMATIQUE IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:3000"
$testResults = @()

# Fonction helper pour tester une route
function Test-Route {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = "$baseUrl$Url"
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            UseBasicParsing = $true
            MaximumRedirection = 0  # Ne pas suivre les redirections
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  ✅ PASS - Status $($response.StatusCode)" -ForegroundColor Green
            $script:testResults += @{Test = $Name; Status = "PASS"; Code = $response.StatusCode}
            return $true
        } else {
            Write-Host "  ❌ FAIL - Expected $ExpectedStatus, got $($response.StatusCode)" -ForegroundColor Red
            $script:testResults += @{Test = $Name; Status = "FAIL"; Code = $response.StatusCode}
            return $false
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✅ PASS - Status $statusCode (expected)" -ForegroundColor Green
            $script:testResults += @{Test = $Name; Status = "PASS"; Code = $statusCode}
            return $true
        } else {
            Write-Host "  ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
            $script:testResults += @{Test = $Name; Status = "FAIL"; Code = $statusCode; Error = $_.Exception.Message}
            return $false
        }
    }
}

# ============================================
# PHASE 1 : Vérifier que le serveur tourne
# ============================================
Write-Host "`n[PHASE 1] Vérification serveur Next.js..." -ForegroundColor Cyan

try {
    $health = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Serveur accessible sur $baseUrl" -ForegroundColor Green
}
catch {
    Write-Host "❌ Serveur non accessible. Lancez d'abord: npm run dev" -ForegroundColor Red
    exit 1
}

# ============================================
# PHASE 2 : Tests Routes Publiques
# ============================================
Write-Host "`n[PHASE 2] Tests Routes Publiques..." -ForegroundColor Cyan

Test-Route -Name "Page Home" -Url "/" -ExpectedStatus 200
Test-Route -Name "Page Login" -Url "/auth/login" -ExpectedStatus 200

# ============================================
# PHASE 3 : Tests Routes Protégées (sans auth)
# ============================================
Write-Host "`n[PHASE 3] Tests Routes Protégées (sans authentification)..." -ForegroundColor Cyan

# Ces routes doivent rediriger vers login (302) ou refuser (403)
Test-Route -Name "Dashboard sans auth" -Url "/dashboard" -ExpectedStatus 307
Test-Route -Name "Super Admin sans auth" -Url "/super-admin" -ExpectedStatus 307
Test-Route -Name "Clients sans auth" -Url "/clients" -ExpectedStatus 307
Test-Route -Name "Dossiers sans auth" -Url "/dossiers" -ExpectedStatus 307

# ============================================
# PHASE 4 : Tests API Routes (isolation)
# ============================================
Write-Host "`n[PHASE 4] Tests API Routes (isolation tenant)..." -ForegroundColor Cyan

# Sans token = 401 ou 403
Test-Route -Name "API Super Admin Tenants (no auth)" -Url "/api/super-admin/tenants" -ExpectedStatus 401
Test-Route -Name "API Admin Dossiers (no auth)" -Url "/api/admin/dossiers" -ExpectedStatus 401
Test-Route -Name "API Admin Clients (no auth)" -Url "/api/admin/clients" -ExpectedStatus 401
Test-Route -Name "API Client Dossiers (no auth)" -Url "/api/client/my-dossiers" -ExpectedStatus 401

# ============================================
# PHASE 5 : Vérification Structure Base
# ============================================
Write-Host "`n[PHASE 5] Vérification Structure Base de Données..." -ForegroundColor Cyan

if (Test-Path ".\prisma\dev.db") {
    Write-Host "✅ Base de données trouvée: prisma\dev.db" -ForegroundColor Green
    
    # Vérifier si seeds existent
    $dbSize = (Get-Item ".\prisma\dev.db").Length / 1KB
    Write-Host "  Taille DB: $([math]::Round($dbSize, 2)) KB" -ForegroundColor Gray
    
    if ($dbSize -lt 10) {
        Write-Host "  ⚠️  DB semble vide. Lancez: npx prisma db seed" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ DB semble initialisée" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Base de données non trouvée. Lancez: npx prisma db push" -ForegroundColor Red
}

# ============================================
# PHASE 6 : Vérification Fichiers Clés
# ============================================
Write-Host "`n[PHASE 6] Vérification Fichiers Clés..." -ForegroundColor Cyan

$requiredFiles = @(
    "src\lib\planLimits.ts",
    "src\proxy.ts",
    "src\app\api\super-admin\tenants\route.ts",
    "src\app\api\admin\dossiers\route.ts",
    "src\app\api\admin\clients\route.ts",
    "src\app\super-admin\page.tsx",
    "src\app\admin\page.tsx",
    "src\app\client\page.tsx",
    "prisma\seed.ts",
    "docs\CHARTE_IA.md",
    "docs\PROMPT_CURSOR.md"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MANQUANT" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host "`n✅ Tous les fichiers clés présents" -ForegroundColor Green
} else {
    Write-Host "`n❌ $($missingFiles.Count) fichier(s) manquant(s)" -ForegroundColor Red
}

# ============================================
# PHASE 7 : Test Limites Plan (simulation)
# ============================================
Write-Host "`n[PHASE 7] Test Logique Limites Plan..." -ForegroundColor Cyan

if (Test-Path "src\lib\planLimits.ts") {
    $planLimitsContent = Get-Content "src\lib\planLimits.ts" -Raw
    
    $checks = @(
        @{Name = "canCreateDossier"; Pattern = "export.*function canCreateDossier"},
        @{Name = "canAddClient"; Pattern = "export.*function canAddClient"},
        @{Name = "canPerformAIAction"; Pattern = "export.*function canPerformAIAction"},
        @{Name = "AIAction enum"; Pattern = "export enum AIAction"},
        @{Name = "incrementDossierCount"; Pattern = "export.*function incrementDossierCount"}
    )
    
    foreach ($check in $checks) {
        if ($planLimitsContent -match $check.Pattern) {
            Write-Host "  ✅ $($check.Name) présent" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($check.Name) MANQUANT" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ❌ planLimits.ts non trouvé" -ForegroundColor Red
}

# ============================================
# RAPPORT FINAL
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RAPPORT DE TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passedTests = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "  ✅ Réussis: $passedTests" -ForegroundColor Green
Write-Host "  ❌ Échoués: $failedTests" -ForegroundColor Red

if ($failedTests -gt 0) {
    Write-Host "`nTests échoués:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test) (Code: $($_.Code))" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not (Test-Path ".\prisma\dev.db")) {
    Write-Host "1. Initialiser la DB:" -ForegroundColor Yellow
    Write-Host "   npx prisma db push" -ForegroundColor White
    Write-Host "   npx prisma db seed`n" -ForegroundColor White
}

Write-Host "2. Tester avec authentification:" -ForegroundColor Yellow
Write-Host "   - Connectez-vous avec: admin@iapostemanager.com / Admin123!" -ForegroundColor White
Write-Host "   - Testez les dashboards manuellement`n" -ForegroundColor White

Write-Host "3. Tester les limites plan:" -ForegroundColor Yellow
Write-Host "   - Créez 10 clients (limite Basic)" -ForegroundColor White
Write-Host "   - Vérifiez le message d'erreur au 11e`n" -ForegroundColor White

Write-Host "4. Tester l'isolation tenant:" -ForegroundColor Yellow
Write-Host "   - Connectez-vous comme avocat Cabinet Dupont" -ForegroundColor White
Write-Host "   - Vérifiez que vous ne voyez QUE ses clients/dossiers`n" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Sauvegarder rapport
$reportPath = ".\test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$testResults | ConvertTo-Json | Out-File $reportPath
Write-Host "Rapport sauvegardé dans: $reportPath" -ForegroundColor Gray
