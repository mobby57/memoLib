# Quick PostgreSQL Configuration Test

Write-Host "`n🧪 TEST POSTGRESQL - QUICKCHECK`n" -ForegroundColor Cyan

$passed = 0
$failed = 0

# Test 1: Files exist
Write-Host "📁 Fichiers..." -NoNewline
if ((Test-Path "src/lib/postgres.config.ts") -and (Test-Path "docker-compose.yml")) {
    Write-Host " ✅" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ❌" -ForegroundColor Red
    $failed++
}

# Test 2: Docker
Write-Host "🐳 Docker..." -NoNewline
docker info 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ❌ (non démarré)" -ForegroundColor Yellow
    $failed++
}

# Test 3: Dependencies
Write-Host "📦 Dépendances..." -NoNewline
if ((Test-Path "node_modules/.prisma") -and (npm list prisma 2>$null)) {
    Write-Host " ✅" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ⚠️  (npx prisma generate)" -ForegroundColor Yellow
    $failed++
}

# Test 4: PostgreSQL container
Write-Host "🐘 PostgreSQL..." -NoNewline
$pgContainer = docker ps --filter "name=iaposte_postgres" --format "{{.Names}}" 2>$null
if ($pgContainer -eq "iaposte_postgres") {
    Write-Host " ✅ Running" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ⚠️  (docker-compose up -d postgres)" -ForegroundColor Yellow
    $failed++
}

# Test 5: pgAdmin
Write-Host "📊 pgAdmin..." -NoNewline
$pgAdmin = docker ps --filter "name=iaposte_pgadmin" --format "{{.Names}}" 2>$null
if ($pgAdmin -eq "iaposte_pgadmin") {
    Write-Host " ✅ http://localhost:5050" -ForegroundColor Green
    $passed++
} else {
    Write-Host " ⚠️  (docker-compose up -d pgadmin)" -ForegroundColor Yellow
    $failed++
}

# Results
$total = $passed + $failed
$pct = if ($total -gt 0) { [math]::Round(($passed / $total) * 100) } else { 0 }

Write-Host "`n📊 Score: $pct% ($passed/$total)" -ForegroundColor $(if ($pct -ge 80) { 'Green' } elseif ($pct -ge 60) { 'Yellow' } else { 'Red' })

if ($pct -lt 100) {
    Write-Host "`n💡 Commandes utiles:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d postgres pgadmin" -ForegroundColor Gray
    Write-Host "   npx prisma generate" -ForegroundColor Gray
    Write-Host "   npx prisma db push" -ForegroundColor Gray
}

Write-Host ""
