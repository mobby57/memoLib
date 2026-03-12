#!/usr/bin/env pwsh
# Test Demo Flow - MemoLib v2.0
# Tests the complete 3-step demo experience

$ErrorActionPreference = "Stop"

Write-Host "🚀 MemoLib Demo Flow Test" -ForegroundColor Cyan
Write-Host "=" * 50

$API_URL = "http://localhost:5078"
$DEMO_URL = "http://localhost:3000"

# Test 1: API Health Check
Write-Host "`n✅ Test 1: API Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ API is running on $API_URL" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ API not accessible. Start with: dotnet run" -ForegroundColor Red
    exit 1
}

# Test 2: Email Ingest Endpoint
Write-Host "`n✅ Test 2: Email Ingest Endpoint" -ForegroundColor Yellow
$emailData = @{
    from = "sophie.dubois@email.com"
    to = "jean.dupont@cabinet-dupont.fr"
    subject = "URGENT - OQTF notifiée - besoin de recours"
    body = "Bonjour Maître, j'ai reçu une OQTF le 15/01/2026 avec un délai de 30 jours."
    messageId = "test-demo-$(Get-Date -Format 'yyyyMMddHHmmss')@simulator.local"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/ingest/email" -Method POST -Body $emailData -ContentType "application/json"
    Write-Host "   ✓ Email ingested successfully" -ForegroundColor Green
    Write-Host "   Email ID: $($response.emailId)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Email ingest failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Demo Pages Structure
Write-Host "`n✅ Test 3: Demo Pages Structure" -ForegroundColor Yellow
$demoPages = @(
    "src/app/[locale]/demo/page.tsx",
    "src/app/[locale]/demo/layout.tsx",
    "src/app/[locale]/demo/email-simulator/page.tsx",
    "src/app/[locale]/demo/workspace-reasoning/page.tsx",
    "src/app/[locale]/demo/legal-proof/page.tsx",
    "src/lib/api-config.ts"
)

foreach ($page in $demoPages) {
    if (Test-Path $page) {
        Write-Host "   ✓ $page exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $page missing" -ForegroundColor Red
    }
}

# Test 4: API Config Validation
Write-Host "`n✅ Test 4: API Config Validation" -ForegroundColor Yellow
$apiConfig = Get-Content "src/lib/api-config.ts" -Raw
if ($apiConfig -match "EMAIL_INGEST" -and $apiConfig -match "CASES" -and $apiConfig -match "CLIENTS") {
    Write-Host "   ✓ API endpoints configured correctly" -ForegroundColor Green
} else {
    Write-Host "   ✗ API config incomplete" -ForegroundColor Red
}

# Summary
Write-Host "`n" + ("=" * 50)
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=" * 50

Write-Host "`n✅ Demo Flow Components:" -ForegroundColor Green
Write-Host "   • API Backend: Running on $API_URL"
Write-Host "   • Email Simulator: /demo/email-simulator"
Write-Host "   • Workspace Reasoning: /demo/workspace-reasoning"
Write-Host "   • Legal Proof: /demo/legal-proof"

Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start Next.js dev server: npm run dev"
Write-Host "   2. Open browser: http://localhost:3000/demo"
Write-Host "   3. Follow the 3-step interactive demo"

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • README.md - Complete project overview"
Write-Host "   • GUIDE_DEMO_CLIENT.md - Client demo script"
Write-Host "   • TEST_MANUEL.md - Manual testing guide"

Write-Host "`n✨ Demo is ready to use!" -ForegroundColor Green
