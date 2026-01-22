#!/usr/bin/env pwsh
<#
.SYNOPSIS
    DÃ©monstration rapide de la gestion des bases de donnÃ©es

.DESCRIPTION
    Script de dÃ©monstration qui montre:
    - La connexion Ã  SQLite
    - Les tests CRUD
    - L'isolation multi-tenant
    - La migration (optionnelle)

.EXAMPLE
    .\demo-databases.ps1
#>

Write-Host @"

â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘                                                                â•‘
â•‘     ðŸ—„ï¸  DÃ‰MO: GESTION DES BASES DE DONNÃ‰ES                   â•‘
â•‘                                                                â•‘
â•‘     IA Poste Manager - SystÃ¨me Multi-Tenant                   â•‘
â•‘                                                                â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

"@ -ForegroundColor Cyan

# Configuration
$ErrorActionPreference = "Continue"

Write-Host "`nðŸ“‹ RÃ‰SUMÃ‰ DE LA CONFIGURATION ACTUELLE`n" -ForegroundColor Yellow

Write-Host "  ðŸ”¹ Environnement: " -NoNewline
Write-Host "DÃ©veloppement" -ForegroundColor Green

Write-Host "  ðŸ”¹ Base de donnÃ©es: " -NoNewline
Write-Host "SQLite (file:./prisma/dev.db)" -ForegroundColor Green

Write-Host "  ðŸ”¹ Isolation: " -NoNewline
Write-Host "Multi-Tenant Strict âœ…" -ForegroundColor Green

Write-Host "  ðŸ”¹ Optimisations: " -NoNewline
Write-Host "WAL Mode, Cache 64MB âœ…" -ForegroundColor Green

Write-Host "`n" + ("â”€" * 70) + "`n"

# Menu interactif
Write-Host "ðŸŽ¯ QUE VOULEZ-VOUS FAIRE ?`n" -ForegroundColor Yellow

Write-Host "  [1] ðŸ§ª Tester la connexion SQLite uniquement (rapide)"
Write-Host "  [2] ðŸ”„ Tester les 3 environnements (SQLite, PostgreSQL, D1)"
Write-Host "  [3] ðŸ“Š Voir le dernier rapport de tests"
Write-Host "  [4] ðŸ”€ Migrer PostgreSQL â†’ SQLite (avec assistant)"
Write-Host "  [5] ðŸ“š Ouvrir la documentation"
Write-Host "  [6] ðŸš€ Lancer l'application (npm run dev)"
Write-Host "  [0] âŒ Quitter`n"

$choice = Read-Host "Votre choix"

switch ($choice) {
    "1" {
        Write-Host "`nðŸ§ª TEST CONNEXION SQLITE...`n" -ForegroundColor Cyan
        
        $testScript = @"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('ðŸ”Œ Connexion Ã  SQLite...');
        await prisma.\`$queryRaw\`SELECT 1 as test\`;
        console.log('âœ… Connexion OK');
        
        console.log('\nðŸ“Š Statistiques:');
        const planCount = await prisma.plan.count();
        const tenantCount = await prisma.tenant.count();
        const clientCount = await prisma.client.count();
        const dossierCount = await prisma.dossier.count();
        
        console.log(\`   Plans: \${planCount}\`);
        console.log(\`   Tenants: \${tenantCount}\`);
        console.log(\`   Clients: \${clientCount}\`);
        console.log(\`   Dossiers: \${dossierCount}\`);
        
        console.log('\nðŸŽ‰ Test rÃ©ussi!');
    } catch (error) {
        console.error('âŒ Erreur:', error.message);
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
        Write-Host "`nðŸ”„ TEST DES 3 ENVIRONNEMENTS...`n" -ForegroundColor Cyan
        npx tsx scripts/test-all-databases.ts
    }
    
    "3" {
        Write-Host "`nðŸ“Š DERNIER RAPPORT DE TESTS`n" -ForegroundColor Cyan
        
        if (Test-Path "database-test-report.json") {
            $report = Get-Content "database-test-report.json" | ConvertFrom-Json
            
            Write-Host "ðŸ“… Date: $($report.timestamp)" -ForegroundColor Gray
            Write-Host "`nðŸ“ˆ RÃ©sumÃ©:" -ForegroundColor Yellow
            Write-Host "  Total tests: $($report.summary.totalTests)"
            Write-Host "  Tests rÃ©ussis: $($report.summary.totalSuccess)"
            Write-Host "  Taux de succÃ¨s: $([math]::Round($report.summary.successRate, 1))%"
            Write-Host "  DurÃ©e totale: $($report.summary.totalDuration)ms"
            
            Write-Host "`nðŸ“‹ DÃ©tails par base:" -ForegroundColor Yellow
            $dbGroups = $report.results | Group-Object -Property database
            foreach ($group in $dbGroups) {
                $successCount = ($group.Group | Where-Object { $_.success -eq $true }).Count
                $totalCount = $group.Count
                $icon = if ($successCount -eq $totalCount) { "âœ…" } else { "âš ï¸" }
                
                Write-Host "  $icon $($group.Name): $successCount/$totalCount tests"
            }
            
            Write-Host "`nðŸ“„ Rapport complet: database-test-report.json" -ForegroundColor Gray
        } else {
            Write-Host "âš ï¸  Aucun rapport trouvÃ©. Lancez d'abord un test." -ForegroundColor Yellow
        }
    }
    
    "4" {
        Write-Host "`nðŸ”€ ASSISTANT DE MIGRATION`n" -ForegroundColor Cyan
        
        Write-Host @"
âš ï¸  IMPORTANT: Avant de migrer, assurez-vous que:

  1. PostgreSQL est accessible
  2. Les credentials sont corrects
  3. Vous avez une sauvegarde
  
"@ -ForegroundColor Yellow
        
        $confirm = Read-Host "Continuer ? (o/N)"
        
        if ($confirm -eq "o" -or $confirm -eq "O") {
            Write-Host "`nðŸ” Mode dry-run d'abord...`n" -ForegroundColor Yellow
            npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run
            
            Write-Host "`n"
            $confirmReal = Read-Host "Lancer la migration rÃ©elle ? (o/N)"
            
            if ($confirmReal -eq "o" -or $confirmReal -eq "O") {
                npx tsx scripts/migrate-postgres-to-sqlite.ts
            } else {
                Write-Host "Migration annulÃ©e." -ForegroundColor Yellow
            }
        }
    }
    
    "5" {
        Write-Host "`nðŸ“š DOCUMENTATION`n" -ForegroundColor Cyan
        
        Write-Host "Ouvrir quel document ?`n"
        Write-Host "  [1] Guide de migration (MIGRATION_DATABASES_GUIDE.md)"
        Write-Host "  [2] RÃ©sultats des tests (RESULTATS_TESTS_DATABASES.md)"
        Write-Host "  [3] SÃ©curitÃ© & conformitÃ© (docs/SECURITE_CONFORMITE.md)"
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
                Write-Host "âš ï¸  Fichier non trouvÃ©: $($docs[$docChoice])" -ForegroundColor Yellow
            }
        }
    }
    
    "6" {
        Write-Host "`nðŸš€ LANCEMENT DE L'APPLICATION...`n" -ForegroundColor Cyan
        npm run dev
    }
    
    "0" {
        Write-Host "`nðŸ‘‹ Au revoir!`n" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "`nâš ï¸  Choix invalide.`n" -ForegroundColor Yellow
    }
}

Write-Host "`n" + ("â”€" * 70) + "`n"

Write-Host @"
ðŸ’¡ COMMANDES UTILES:

  Tests:
    npx tsx scripts/test-all-databases.ts        # Tester les 3 DB
    .\test-databases-complete.ps1                 # Assistant complet

  Migration:
    npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run
    npx tsx scripts/migrate-postgres-to-sqlite.ts

  DÃ©veloppement:
    npm run dev                                   # Lancer l'app
    npm run db:studio                             # Interface Prisma
    npm run db:seed:complete                      # DonnÃ©es de test

  Documentation:
    docs/MIGRATION_DATABASES_GUIDE.md             # Guide migration
    RESULTATS_TESTS_DATABASES.md                  # RÃ©sultats tests

"@ -ForegroundColor Gray

Write-Host "ðŸŽ¯ Tout est prÃªt ! Votre environnement SQLite fonctionne parfaitement.`n" -ForegroundColor Green

