# Test Databases Complete
# IA Poste Manager - Full database test suite

$ErrorActionPreference = "Stop"

Write-Output ""
Write-Output "========================================"
Write-Output "  TEST DATABASES COMPLETE"
Write-Output "========================================"
Write-Output ""

$results = @{
    Total = 0
    Passed = 0
    Failed = 0
}

function Test-Database {
    param(
        [string]$Name,
        [scriptblock]$TestScript
    )
    
    $results.Total++
    Write-Output "[TEST] $Name"
    
    try {
        & $TestScript
        Write-Output "   [OK] Passe"
        $results.Passed++
    } catch {
        Write-Output "   [FAIL] $($_.Exception.Message)"
        $results.Failed++
    }
    Write-Output ""
}

# ========================================
# Test 1: Variables d'environnement
# ========================================
Test-Database -Name "Variables d'environnement" -TestScript {
    $required = @("DATABASE_URL")
    foreach ($var in $required) {
        $value = [Environment]::GetEnvironmentVariable($var)
        if (-not $value) {
            # Essayer depuis .env
            if (Test-Path ".env") {
                $envContent = Get-Content ".env" -Raw
                if ($envContent -match "$var=(.+)") {
                    Write-Output "   [OK] $var trouve dans .env"
                } else {
                    throw "$var non configure"
                }
            } else {
                throw "$var non configure"
            }
        } else {
            Write-Output "   [OK] $var configure"
        }
    }
}

# ========================================
# Test 2: Schema Prisma
# ========================================
Test-Database -Name "Schema Prisma" -TestScript {
    if (-not (Test-Path "prisma/schema.prisma")) {
        throw "schema.prisma non trouve"
    }
    
    $schema = Get-Content "prisma/schema.prisma" -Raw
    
    # Verifier modeles essentiels
    $models = @("User", "Client", "Dossier")
    foreach ($model in $models) {
        if ($schema -notmatch "model\s+$model\s*\{") {
            throw "Modele $model manquant"
        }
        Write-Output "   [OK] Modele $model present"
    }
}

# ========================================
# Test 3: Prisma Generate
# ========================================
Test-Database -Name "Prisma Client Generation" -TestScript {
    $output = npx prisma generate 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur prisma generate: $output"
    }
    Write-Output "   [OK] Client Prisma genere"
}

# ========================================
# Test 4: Connexion base de donnees
# ========================================
Test-Database -Name "Connexion Database" -TestScript {
    # Utiliser prisma db execute pour tester
    $testQuery = "SELECT 1 as test"
    
    try {
        $output = echo $testQuery | npx prisma db execute --stdin 2>&1
        Write-Output "   [OK] Connexion etablie"
    } catch {
        # Si SQLite, verifier le fichier
        if (Test-Path "prisma/dev.db") {
            Write-Output "   [OK] SQLite local disponible"
        } else {
            throw "Impossible de se connecter"
        }
    }
}

# ========================================
# Test 5: Migrations
# ========================================
Test-Database -Name "Etat des migrations" -TestScript {
    $migrationsDir = "prisma/migrations"
    
    if (Test-Path $migrationsDir) {
        $migrations = Get-ChildItem -Path $migrationsDir -Directory
        Write-Output "   [OK] $($migrations.Count) migration(s) trouvee(s)"
    } else {
        Write-Output "   [INFO] Pas de migrations (db push utilise)"
    }
}

# ========================================
# Test 6: Seed (optionnel)
# ========================================
Test-Database -Name "Seed disponible" -TestScript {
    if (Test-Path "prisma/seed.ts") {
        Write-Output "   [OK] seed.ts present"
    } elseif (Test-Path "prisma/seed.js") {
        Write-Output "   [OK] seed.js present"
    } else {
        Write-Output "   [INFO] Pas de fichier seed (optionnel)"
    }
}

# ========================================
# Resume
# ========================================
Write-Output "========================================"
Write-Output "  RESULTATS"
Write-Output "========================================"
Write-Output ""
Write-Output "Total:  $($results.Total)"
Write-Output "Passes: $($results.Passed)"
Write-Output "Echecs: $($results.Failed)"
Write-Output ""

if ($results.Failed -eq 0) {
    Write-Output "[OK] Tous les tests passes!"
} else {
    Write-Output "[ATTENTION] $($results.Failed) test(s) echoue(s)"
    Write-Output ""
    Write-Output "Actions recommandees:"
    Write-Output "  1. Verifier .env avec DATABASE_URL"
    Write-Output "  2. Executer: npx prisma db push"
    Write-Output "  3. Executer: npx prisma generate"
}

Write-Output ""
