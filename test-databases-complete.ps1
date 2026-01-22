/**
 * Script PowerShell de Migration et Test Complet
 * Teste les 3 bases de données et effectue la migration si nécessaire
 */

Write-Host "🔄 MIGRATION ET TEST COMPLET DES BASES DE DONNÉES" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ErrorActionPreference = "Continue"
$exitCode = 0

# Fonction de test
function Test-Command {
    param($command)
    try {
        $null = Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Fonction d'exécution avec gestion d'erreur
function Invoke-SafeCommand {
    param(
        [string]$Description,
        [scriptblock]$Command
    )
    
    Write-Host ""
    Write-Host "🔹 $Description..." -ForegroundColor Yellow
    
    try {
        & $Command
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-Host "   ✅ $Description OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   ❌ $Description échoué (code: $LASTEXITCODE)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Vérifier les prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Cyan
Write-Host ""

$prerequisites = @{
    "Node.js" = Test-Command "node"
    "npm" = Test-Command "npm"
    "tsx" = Test-Command "tsx"
    "Prisma" = Test-Command "prisma"
    "Docker" = Test-Command "docker"
}

foreach ($prereq in $prerequisites.GetEnumerator()) {
    $status = if ($prereq.Value) { "✅" } else { "❌" }
    Write-Host "$status $($prereq.Key)" -ForegroundColor $(if ($prereq.Value) { "Green" } else { "Red" })
}

Write-Host ""

# Vérifier si Docker tourne
Write-Host "🐳 Vérification Docker..." -ForegroundColor Cyan
try {
    docker ps | Out-Null
    Write-Host "   ✅ Docker actif" -ForegroundColor Green
    $dockerRunning = $true
} catch {
    Write-Host "   ⚠️  Docker non disponible (tests PostgreSQL ignorés)" -ForegroundColor Yellow
    $dockerRunning = $false
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🧪 ÉTAPE 1: TEST DES 3 BASES DE DONNÉES" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Test des bases de données
$testResult = Invoke-SafeCommand `
    -Description "Test complet des 3 environnements" `
    -Command { npx tsx scripts/test-all-databases.ts }

if (-not $testResult) {
    Write-Host ""
    Write-Host "⚠️  Certains tests ont échoué. Vérifiez database-test-report.json" -ForegroundColor Yellow
    $exitCode = 1
}

# Demander si migration est nécessaire
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🔄 ÉTAPE 2: MIGRATION (OPTIONNELLE)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$doMigration = Read-Host "Voulez-vous migrer PostgreSQL → SQLite ? (o/N)"

if ($doMigration -eq "o" -or $doMigration -eq "O") {
    
    # Mode dry-run d'abord
    Write-Host ""
    Write-Host "🔍 Test de migration (dry-run)..." -ForegroundColor Yellow
    
    $dryRunResult = Invoke-SafeCommand `
        -Description "Migration en mode dry-run" `
        -Command { npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run }
    
    if (-not $dryRunResult) {
        Write-Host ""
        Write-Host "❌ Le dry-run a échoué. Migration annulée." -ForegroundColor Red
        $exitCode = 1
    } else {
        # Migration réelle
        Write-Host ""
        $confirmMigration = Read-Host "Dry-run OK. Lancer la migration réelle ? (o/N)"
        
        if ($confirmMigration -eq "o" -or $confirmMigration -eq "O") {
            
            $migrationResult = Invoke-SafeCommand `
                -Description "Migration PostgreSQL → SQLite" `
                -Command { npx tsx scripts/migrate-postgres-to-sqlite.ts }
            
            if ($migrationResult) {
                Write-Host ""
                Write-Host "✅ Migration terminée avec succès!" -ForegroundColor Green
                Write-Host "📄 Rapport: migration-report.json" -ForegroundColor Cyan
                
                # Re-tester après migration
                Write-Host ""
                Write-Host "🔄 Re-test des bases de données après migration..." -ForegroundColor Yellow
                
                Invoke-SafeCommand `
                    -Description "Validation post-migration" `
                    -Command { npx tsx scripts/test-all-databases.ts }
                
            } else {
                Write-Host ""
                Write-Host "❌ Migration échouée. Vérifiez migration-report.json" -ForegroundColor Red
                $exitCode = 1
            }
        } else {
            Write-Host "   ⚠️  Migration annulée par l'utilisateur" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️  Migration ignorée" -ForegroundColor Yellow
}

# Résumé final
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ FINAL" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Afficher les rapports disponibles
$reports = @()
if (Test-Path "database-test-report.json") {
    $reports += "database-test-report.json"
}
if (Test-Path "migration-report.json") {
    $reports += "migration-report.json"
}

if ($reports.Count -gt 0) {
    Write-Host "📄 Rapports générés:" -ForegroundColor Cyan
    foreach ($report in $reports) {
        Write-Host "   - $report" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  Aucun rapport généré" -ForegroundColor Yellow
}

Write-Host ""

# Recommandations
if ($exitCode -eq 0) {
    Write-Host "✅ Tous les tests et migrations ont réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Prochaines étapes recommandées:" -ForegroundColor Cyan
    Write-Host "   1. Vérifier les rapports JSON" -ForegroundColor White
    Write-Host "   2. Tester l'application: npm run dev" -ForegroundColor White
    Write-Host "   3. Déployer si tout est OK" -ForegroundColor White
} else {
    Write-Host "❌ Des erreurs ont été détectées" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Actions recommandées:" -ForegroundColor Cyan
    Write-Host "   1. Vérifier les rapports d'erreur" -ForegroundColor White
    Write-Host "   2. Consulter les logs" -ForegroundColor White
    Write-Host "   3. Corriger les problèmes" -ForegroundColor White
    Write-Host "   4. Relancer ce script" -ForegroundColor White
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan

exit $exitCode
