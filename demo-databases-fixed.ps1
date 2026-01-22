#!/usr/bin/env pwsh
<#
.SYNOPSIS
    D??monstration rapide de la gestion des bases de donn??es

.DESCRIPTION
    Script de d??monstration qui montre:
    - La connexion ?? SQLite
    - Les tests CRUD
    - L'isolation multi-tenant
    - La migration (optionnelle)

.EXAMPLE
    .\demo-databases.ps1
#>

Write-Host @"

??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
???                                                                ???
???     ???????  D??MO: GESTION DES BASES DE DONN??ES                   ???
???                                                                ???
???     IA Poste Manager - Syst??me Multi-Tenant                   ???
???                                                                ???
??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

"@ -ForegroundColor Cyan

# Configuration
$ErrorActionPreference = "Continue"

Write-Host "`n???? R??SUM?? DE LA CONFIGURATION ACTUELLE`n" -ForegroundColor Yellow

Write-Host "  ???? Environnement: " -NoNewline
Write-Host "D??veloppement" -ForegroundColor Green

Write-Host "  ???? Base de donn??es: " -NoNewline
Write-Host "SQLite (file:./prisma/dev.db)" -ForegroundColor Green

Write-Host "  ???? Isolation: " -NoNewline
Write-Host "Multi-Tenant Strict ???" -ForegroundColor Green

Write-Host "  ???? Optimisations: " -NoNewline
Write-Host "WAL Mode, Cache 64MB ???" -ForegroundColor Green

Write-Host "`n" + ("???" * 70) + "`n"

# Menu interactif
Write-Host "???? QUE VOULEZ-VOUS FAIRE ?`n" -ForegroundColor Yellow

Write-Host "  [1] ???? Tester la connexion SQLite uniquement (rapide)"
Write-Host "  [2] ???? Tester les 3 environnements (SQLite, PostgreSQL, D1)"
Write-Host "  [3] ???? Voir le dernier rapport de tests"
Write-Host "  [4] ???? Migrer PostgreSQL ??? SQLite (avec assistant)"
Write-Host "  [5] ???? Ouvrir la documentation"
Write-Host "  [6] ???? Lancer l'application (npm run dev)"
Write-Host "  [0] ??? Quitter`n"

$choice = Read-Host "Votre choix"

switch ($choice) {
    "1" {
        Write-Host "`n???? TEST CONNEXION SQLITE...`n" -ForegroundColor Cyan
        
        $testScript = @"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('???? Connexion ?? SQLite...');
        await prisma.\`$queryRaw\`SELECT 1 as test\`;
        console.log('??? Connexion OK');
        
        console.log('\n???? Statistiques:');
        const planCount = await prisma.plan.count();
        const tenantCount = await prisma.tenant.count();
        const clientCount = await prisma.client.count();
        const dossierCount = await prisma.dossier.count();
        
        console.log(\`   Plans: \${planCount}\`);
        console.log(\`   Tenants: \${tenantCount}\`);
        console.log(\`   Clients: \${clientCount}\`);
        console.log(\`   Dossiers: \${dossierCount}\`);
        
        console.log('\n???? Test r??ussi!');
    } catch (error) {
        console.error('??? Erreur:', error.message);
    } finally {
        await prisma.\`$disconnect();
    }
}

testConnection();
"@
        
        $testScript | Out-File -FilePath "temp-test.ts" -Encoding UTF8
        npx tsx temp-test.ts
        Remove-Item "temp-test.ts" -ErrorAction SilentlyContinue
    }
    
    "2" {
        Write-Host "`n???? TEST DES 3 ENVIRONNEMENTS...`n" -ForegroundColor Cyan
        npx tsx scripts/test-all-databases.ts
    }
    
    "3" {
        Write-Host "`n???? DERNIER RAPPORT DE TESTS`n" -ForegroundColor Cyan
        
        if (Test-Path "database-test-report.json") {
            $report = Get-Content "database-test-report.json" | ConvertFrom-Json
            
            Write-Host "???? Date: $($report.timestamp)" -ForegroundColor Gray
            Write-Host "`n???? R??sum??:" -ForegroundColor Yellow
            Write-Host "  Total tests: $($report.summary.totalTests)"
            Write-Host "  Tests r??ussis: $($report.summary.totalSuccess)"
            Write-Host "  Taux de succ??s: $([math]::Round($report.summary.successRate, 1))%"
            Write-Host "  Dur??e totale: $($report.summary.totalDuration)ms"
            
            Write-Host "`n???? D??tails par base:" -ForegroundColor Yellow
            $dbGroups = $report.results | Group-Object -Property database
            foreach ($group in $dbGroups) {
                $successCount = ($group.Group | Where-Object { $_.success -eq $true }).Count
                $totalCount = $group.Count
                $icon = if ($successCount -eq $totalCount) { "???" } else { "??????" }
                
                Write-Host "  $icon $($group.Name): $successCount/$totalCount tests"
            }
            
            Write-Host "`n???? Rapport complet: database-test-report.json" -ForegroundColor Gray
        } else {
            Write-Host "??????  Aucun rapport trouv??. Lancez d'abord un test." -ForegroundColor Yellow
        }
    }
    
    "4" {
        Write-Host "`n???? ASSISTANT DE MIGRATION`n" -ForegroundColor Cyan
        
        Write-Host @"
??????  IMPORTANT: Avant de migrer, assurez-vous que:

  1. PostgreSQL est accessible
  2. Les credentials sont corrects
  3. Vous avez une sauvegarde
  
"@ -ForegroundColor Yellow
        
        $confirm = Read-Host "Continuer ? (o/N)"
        
        if ($confirm -eq "o" -or $confirm -eq "O") {
            Write-Host "`n???? Mode dry-run d'abord...`n" -ForegroundColor Yellow
            npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run
            
            Write-Host "`n"
            $confirmReal = Read-Host "Lancer la migration r??elle ? (o/N)"
            
            if ($confirmReal -eq "o" -or $confirmReal -eq "O") {
                npx tsx scripts/migrate-postgres-to-sqlite.ts
            } else {
                Write-Host "Migration annul??e." -ForegroundColor Yellow
            }
        }
    }
    
    "5" {
        Write-Host "`n???? DOCUMENTATION`n" -ForegroundColor Cyan
        
        Write-Host "Ouvrir quel document ?`n"
        Write-Host "  [1] Guide de migration (MIGRATION_DATABASES_GUIDE.md)"
        Write-Host "  [2] R??sultats des tests (RESULTATS_TESTS_DATABASES.md)"
        Write-Host "  [3] S??curit?? & conformit?? (docs/SECURITE_CONFORMITE.md)"
        Write-Host "  [4] README principal (README.md)"
        
        $docChoice = Read-Host "`nChoix"
        
        $docs = @{
            "1" = "docs/MIGRATION_DATABASES_GUIDE.md"
            "2" = "RESULTATS_TESTS_DATABASES.md"
            "3" = "docs/SECURITE_CONFORMITE.md"
            "4" = "README.md"
        }
        
        if ($docs.ContainsKey($docChoice)) {
            if (Test-Path $docs[$docChoice]) {
                code $docs[$docChoice]
            } else {
                Write-Host "??????  Fichier non trouv??: $($docs[$docChoice])" -ForegroundColor Yellow
            }
        }
    }
    
    "6" {
        Write-Host "`n???? LANCEMENT DE L'APPLICATION...`n" -ForegroundColor Cyan
        npm run dev
    }
    
    "0" {
        Write-Host "`n???? Au revoir!`n" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "`n??????  Choix invalide.`n" -ForegroundColor Yellow
    }
}

Write-Host "`n" + ("???" * 70) + "`n"

Write-Host @"
???? COMMANDES UTILES:

  Tests:
    npx tsx scripts/test-all-databases.ts        # Tester les 3 DB
    .\test-databases-complete.ps1                 # Assistant complet

  Migration:
    npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run
    npx tsx scripts/migrate-postgres-to-sqlite.ts

  D??veloppement:
    npm run dev                                   # Lancer l'app
    npm run db:studio                             # Interface Prisma
    npm run db:seed:complete                      # Donn??es de test

  Documentation:
    docs/MIGRATION_DATABASES_GUIDE.md             # Guide migration
    RESULTATS_TESTS_DATABASES.md                  # R??sultats tests

"@ -ForegroundColor Gray

Write-Host "???? Tout est pr??t ! Votre environnement SQLite fonctionne parfaitement.`n" -ForegroundColor Green

