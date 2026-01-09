# 🧪 Test PostgreSQL Configuration
# Script PowerShell pour tester toute la configuration

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 TEST POSTGRESQL CONFIGURATION                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$results = @{
    passed = 0
    failed = 0
    warnings = 0
}

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMsg = "OK",
        [string]$FailMsg = "FAILED"
    )
    
    Write-Host "▶️  Testing: $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✅ $SuccessMsg" -ForegroundColor Green
            $script:results.passed++
            return $true
        } else {
            Write-Host " ❌ $FailMsg" -ForegroundColor Red
            $script:results.failed++
            return $false
        }
    } catch {
        Write-Host " ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:results.failed++
        return $false
    }
}

# ============================================
# 🔍 TEST 1: Fichiers de Configuration
# ============================================

Write-Host "`n📁 Vérification des fichiers...`n" -ForegroundColor Yellow

Test-Step "postgres.config.ts exists" {
    Test-Path "src/lib/postgres.config.ts"
}

Test-Step "docker-compose.yml PostgreSQL config" {
    $content = Get-Content "docker-compose.yml" -Raw
    $content -match "postgres:" -and $content -match "POSTGRES_DB"
}

Test-Step "Migration script exists" {
    Test-Path "scripts/migrate-sqlite-to-postgres.ps1"
}

Test-Step "Init SQL script exists" {
    Test-Path "scripts/postgres-init.sql"
}

Test-Step "pgAdmin config exists" {
    Test-Path "scripts/pgadmin-servers.json"
}

# ============================================
# 🐘 TEST 2: Docker PostgreSQL
# ============================================

Write-Host "`n🐘 Vérification Docker PostgreSQL...`n" -ForegroundColor Yellow

$dockerRunning = Test-Step "Docker daemon running" {
    docker info 2>$null
    $LASTEXITCODE -eq 0
}

if ($dockerRunning) {
    Test-Step "PostgreSQL container exists" {
        $container = docker ps -a --filter "name=iaposte_postgres" --format "{{.Names}}"
        $container -eq "iaposte_postgres"
    }
    
    Test-Step "PostgreSQL container running" {
        $status = docker ps --filter "name=iaposte_postgres" --filter "status=running" --format "{{.Names}}"
        $status -eq "iaposte_postgres"
    }
    
    Test-Step "PostgreSQL health check" {
        $health = docker inspect iaposte_postgres --format "{{.State.Health.Status}}" 2>$null
        $health -eq "healthy"
    }
    
    Test-Step "pgAdmin container running" {
        $status = docker ps --filter "name=iaposte_pgadmin" --filter "status=running" --format "{{.Names}}"
        $status -eq "iaposte_pgadmin"
    }
} else {
    Write-Host "   ⚠️  Docker non disponible - Skip tests containers" -ForegroundColor Yellow
    $script:results.warnings++
}

# ============================================
# 🔌 TEST 3: Connexion PostgreSQL
# ============================================

Write-Host "`n🔌 Test de connexion...`n" -ForegroundColor Yellow

if ($dockerRunning) {
    Test-Step "PostgreSQL accepting connections" {
        $result = docker exec iaposte_postgres pg_isready -U iapostemanage 2>$null
        $LASTEXITCODE -eq 0
    }
    
    Test-Step "Database exists" {
        $result = docker exec iaposte_postgres psql -U iapostemanage -lqt 2>$null | Select-String "iapostemanage"
        $result -ne $null
    }
    
    Test-Step "Extensions installed" {
        $result = docker exec iaposte_postgres psql -U iapostemanage -d iapostemanage -c "\dx" 2>$null
        $result -match "uuid-ossp" -and $result -match "pgcrypto"
    }
}

# ============================================
# 📦 TEST 4: Dépendances Node.js
# ============================================

Write-Host "`n📦 Vérification dépendances...`n" -ForegroundColor Yellow

Test-Step "Prisma installed" {
    npm list prisma 2>$null | Select-String "prisma"
}

Test-Step "pg (node-postgres) installed" {
    npm list pg 2>$null | Select-String "pg"
}

Test-Step "Prisma client generated" {
    Test-Path "node_modules/.prisma/client"
}

# ============================================
# 🔧 TEST 5: Configuration TypeScript
# ============================================

Write-Host "`n🔧 Vérification TypeScript...`n" -ForegroundColor Yellow

Test-Step "postgres.config.ts compiles" {
    npx tsc --noEmit src/lib/postgres.config.ts 2>$null
    $LASTEXITCODE -eq 0
}

# ============================================
# 🌐 TEST 6: Accès Web
# ============================================

Write-Host "`n🌐 Test accès web...`n" -ForegroundColor Yellow

Test-Step "pgAdmin accessible (port 5050)" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5050" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# ============================================
# 📊 RÉSULTATS FINAUX
# ============================================

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RÉSULTATS DES TESTS                                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$total = $results.passed + $results.failed
$percentage = if ($total -gt 0) { [math]::Round(($results.passed / $total) * 100, 1) } else { 0 }

Write-Host "   ✅ Tests réussis:  $($results.passed)" -ForegroundColor Green
Write-Host "   ❌ Tests échoués:  $($results.failed)" -ForegroundColor Red
Write-Host "   ⚠️  Warnings:       $($results.warnings)" -ForegroundColor Yellow
Write-Host "   📊 Score:          $percentage%`n" -ForegroundColor $(if ($percentage -ge 80) { 'Green' } elseif ($percentage -ge 60) { 'Yellow' } else { 'Red' })

# ============================================
# 💡 RECOMMANDATIONS
# ============================================

if ($results.failed -gt 0 -or $percentage -lt 80) {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  💡 RECOMMANDATIONS                                       ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    if (-not $dockerRunning) {
        Write-Host "   🐳 Docker n'est pas démarré:" -ForegroundColor White
        Write-Host "      → Démarrer Docker Desktop" -ForegroundColor Gray
        Write-Host "      → docker-compose up -d postgres pgadmin`n" -ForegroundColor Gray
    }
    
    if (!(Test-Path "node_modules/.prisma/client")) {
        Write-Host "   📦 Client Prisma non généré:" -ForegroundColor White
        Write-Host "      → npx prisma generate`n" -ForegroundColor Gray
    }
    
    Write-Host "   📚 Consulter la documentation:" -ForegroundColor White
    Write-Host "      → docs/POSTGRESQL_QUICKSTART.md" -ForegroundColor Gray
    Write-Host "      → docs/POSTGRESQL_CONFIG_GUIDE.md`n" -ForegroundColor Gray
}

# ============================================
# 🚀 PROCHAINES ÉTAPES
# ============================================

if ($percentage -ge 80) {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  🚀 CONFIGURATION VALIDE - PROCHAINES ÉTAPES              ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "   1️⃣  Migrer les données SQLite:" -ForegroundColor Cyan
    Write-Host "      .\scripts\migrate-sqlite-to-postgres.ps1`n" -ForegroundColor White
    
    Write-Host "   2️⃣  Mettre à jour le code:" -ForegroundColor Cyan
    Write-Host "      import { postgres } from '@/lib/postgres.config'`n" -ForegroundColor White
    
    Write-Host "   3️⃣  Accéder à pgAdmin:" -ForegroundColor Cyan
    Write-Host "      http://localhost:5050`n" -ForegroundColor White
    
    Write-Host "   4️⃣  Démarrer l'application:" -ForegroundColor Cyan
    Write-Host "      npm run dev`n" -ForegroundColor White
}

# Code de sortie
if ($results.failed -eq 0) {
    exit 0
} else {
    exit 1
}
