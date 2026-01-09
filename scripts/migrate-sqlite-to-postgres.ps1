# 🔄 MIGRATION SQLITE → POSTGRESQL - SCRIPT AVANCÉ
# 
# Ce script migre automatiquement vos données SQLite vers PostgreSQL
# Compatible: Vercel Postgres, Neon.tech, Supabase, Local Docker
#
# Usage:
#   .\scripts\migrate-sqlite-to-postgres.ps1
#   .\scripts\migrate-sqlite-to-postgres.ps1 -Verify
#   .\scripts\migrate-sqlite-to-postgres.ps1 -DryRun

param(
    [switch]$Verify,
    [switch]$DryRun,
    [string]$PostgresUrl = $env:DATABASE_URL_POSTGRES
)

# ============================================
# 🎨 FONCTIONS UTILITAIRES
# ============================================

function Write-Header {
    param([string]$Text)
    Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $($Text.PadRight(57))║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text, [string]$Status = "")
    $icon = switch ($Status) {
        "OK" { "✅" }
        "ERROR" { "❌" }
        "WARN" { "⚠️" }
        default { "▶️" }
    }
    Write-Host "$icon $Text" -ForegroundColor $(
        switch ($Status) {
            "OK" { "Green" }
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            default { "White" }
        }
    )
}

function Write-Info {
    param([string]$Text)
    Write-Host "   ℹ️  $Text" -ForegroundColor Gray
}

# ============================================
# 🔍 VÉRIFICATIONS PRÉLIMINAIRES
# ============================================

Write-Header "MIGRATION SQLITE → POSTGRESQL"

# Vérifier que SQLite existe
if (-not (Test-Path "prisma/dev.db")) {
    Write-Step "Base SQLite introuvable" "ERROR"
    Write-Info "Fichier attendu: prisma/dev.db"
    exit 1
}

Write-Step "Base SQLite détectée" "OK"

# Vérifier PostgreSQL URL
if (-not $PostgresUrl) {
    Write-Step "URL PostgreSQL non définie" "ERROR"
    Write-Host "`nDéfinissez DATABASE_URL_POSTGRES dans .env.local:" -ForegroundColor Yellow
    Write-Host "  DATABASE_URL_POSTGRES=`"postgresql://user:pass@host:5432/db`"`n" -ForegroundColor Gray
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. Vercel Postgres: vercel integration add postgres" -ForegroundColor White
    Write-Host "  2. Neon.tech:       https://neon.tech (free tier)" -ForegroundColor White
    Write-Host "  3. Supabase:        https://supabase.com (free tier)" -ForegroundColor White
    Write-Host "  4. Local Docker:    docker-compose up postgres`n" -ForegroundColor White
    exit 1
}

Write-Step "URL PostgreSQL configurée" "OK"
Write-Info $PostgresUrl.Replace($(($PostgresUrl -split '@')[0]), '***')

# ============================================
# 📦 INSTALLATION DÉPENDANCES
# ============================================

Write-Header "INSTALLATION DÉPENDANCES"

$packages = @("prisma", "pg", "dotenv")
foreach ($pkg in $packages) {
    if (-not (npm list $pkg 2>$null | Select-String $pkg)) {
        Write-Step "Installation $pkg..." ""
        npm install --save-dev $pkg 2>&1 | Out-Null
        Write-Step "$pkg installé" "OK"
    } else {
        Write-Step "$pkg déjà installé" "OK"
    }
}

# ============================================
# 🗄️ BACKUP SQLITE (SÉCURITÉ)
# ============================================

Write-Header "BACKUP SQLITE"

$backupDir = "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir/dev_$timestamp.db"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Copy-Item "prisma/dev.db" $backupFile -Force
Write-Step "Backup créé: $backupFile" "OK"

# ============================================
# 🔄 CRÉATION SCRIPT MIGRATION NODE.JS
# ============================================

Write-Header "GÉNÉRATION SCRIPT DE MIGRATION"

$migrationScript = @"
// 🔄 Script de migration SQLite → PostgreSQL
// Généré automatiquement par migrate-sqlite-to-postgres.ps1

const { PrismaClient: SQLiteClient } = require('@prisma/client');
const { Client: PostgresClient } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dryRun = process.argv.includes('--dry-run');
const verify = process.argv.includes('--verify');

// Clients
const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
});

const postgres = new PostgresClient({
  connectionString: process.env.DATABASE_URL_POSTGRES,
  ssl: process.env.DATABASE_URL_POSTGRES.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

// ============================================
// 📊 STATISTIQUES
// ============================================

const stats = {
  tables: {},
  total: 0,
  errors: [],
  startTime: Date.now()
};

function recordStat(table, count) {
  stats.tables[table] = count;
  stats.total += count;
}

function recordError(table, error) {
  stats.errors.push({ table, error: error.message });
}

// ============================================
// 🔄 MIGRATION PAR TABLE
// ============================================

async function migrateTable(tableName, sqliteModel, postgresTable) {
  console.log(\`\n▶️  Migration: \${tableName}\`);
  
  try {
    // Récupérer données SQLite
    const data = await sqliteModel.findMany();
    console.log(\`   📥 \${data.length} enregistrements trouvés\`);
    
    if (data.length === 0) {
      console.log('   ✅ Table vide - skip');
      recordStat(tableName, 0);
      return;
    }
    
    if (dryRun) {
      console.log(\`   🔍 [DRY RUN] \${data.length} enregistrements seraient migrés\`);
      recordStat(tableName, data.length);
      return;
    }
    
    // Désactiver temporairement les contraintes
    await postgres.query(\`ALTER TABLE "\${postgresTable}" DISABLE TRIGGER ALL\`);
    
    // Insérer en batch (500 par 500 pour éviter timeout)
    const batchSize = 500;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Générer VALUES pour INSERT
      const values = batch.map((row, idx) => {
        const columns = Object.keys(row);
        const placeholders = columns.map((_, colIdx) => \`\\\$\${idx * columns.length + colIdx + 1}\`).join(', ');
        return \`(\${placeholders})\`;
      }).join(', ');
      
      const columns = Object.keys(batch[0]);
      const flatValues = batch.flatMap(row => columns.map(col => row[col]));
      
      const query = \`
        INSERT INTO "\${postgresTable}" (\${columns.map(c => \`"\${c}"\`).join(', ')})
        VALUES \${values}
        ON CONFLICT DO NOTHING
      \`;
      
      await postgres.query(query, flatValues);
      console.log(\`   ⏳ Batch \${Math.floor(i / batchSize) + 1}/\${Math.ceil(data.length / batchSize)} migré\`);
    }
    
    // Réactiver les contraintes
    await postgres.query(\`ALTER TABLE "\${postgresTable}" ENABLE TRIGGER ALL\`);
    
    console.log(\`   ✅ \${data.length} enregistrements migrés\`);
    recordStat(tableName, data.length);
    
  } catch (error) {
    console.error(\`   ❌ Erreur: \${error.message}\`);
    recordError(tableName, error);
  }
}

// ============================================
// 🚀 EXÉCUTION MIGRATION
// ============================================

async function migrate() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔄 MIGRATION SQLITE → POSTGRESQL                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  if (dryRun) {
    console.log('\n⚠️  MODE DRY RUN - Aucune donnée ne sera modifiée\n');
  }
  
  try {
    // Connexion PostgreSQL
    await postgres.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // Migration des tables principales (ordre important: relations)
    await migrateTable('Plan', sqlite.plan, 'Plan');
    await migrateTable('Tenant', sqlite.tenant, 'Tenant');
    await migrateTable('User', sqlite.user, 'User');
    await migrateTable('Client', sqlite.client, 'Client');
    await migrateTable('Dossier', sqlite.dossier, 'Dossier');
    await migrateTable('Facture', sqlite.facture, 'Facture');
    await migrateTable('Document', sqlite.document, 'Document');
    await migrateTable('RendezVous', sqlite.rendezVous, 'RendezVous');
    await migrateTable('Echeance', sqlite.echeance, 'Echeance');
    await migrateTable('Email', sqlite.email, 'Email');
    await migrateTable('EmailClassification', sqlite.emailClassification, 'EmailClassification');
    await migrateTable('Workspace', sqlite.workspace, 'Workspace');
    await migrateTable('WorkspaceDocument', sqlite.workspaceDocument, 'WorkspaceDocument');
    await migrateTable('AuditLog', sqlite.auditLog, 'AuditLog');
    
    // Statistiques finales
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  📊 RÉSULTATS DE LA MIGRATION                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    Object.entries(stats.tables).forEach(([table, count]) => {
      console.log(\`   \${table.padEnd(30)} \${count.toString().padStart(6)} enregistrements\`);
    });
    
    console.log(\`\n   Total:                         \${stats.total.toString().padStart(6)} enregistrements\`);
    console.log(\`   Durée:                         \${duration}s\`);
    console.log(\`   Erreurs:                       \${stats.errors.length}\n\`);
    
    if (stats.errors.length > 0) {
      console.log('❌ Erreurs rencontrées:\n');
      stats.errors.forEach(({ table, error }) => {
        console.log(\`   - \${table}: \${error}\`);
      });
    } else {
      console.log('✅ Migration terminée avec succès!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    await sqlite.\$disconnect();
    await postgres.end();
  }
}

// ============================================
// 🔍 VÉRIFICATION POST-MIGRATION
// ============================================

async function verifyMigration() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔍 VÉRIFICATION POST-MIGRATION                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  try {
    await postgres.connect();
    
    // Compter les enregistrements dans chaque table
    const tables = ['Plan', 'Tenant', 'User', 'Client', 'Dossier', 'Facture', 
                    'Document', 'RendezVous', 'Echeance', 'Email', 'Workspace', 'AuditLog'];
    
    for (const table of tables) {
      const sqliteCount = await sqlite[table.toLowerCase()].count();
      const postgresResult = await postgres.query(\`SELECT COUNT(*) FROM "\${table}"\`);
      const postgresCount = parseInt(postgresResult.rows[0].count);
      
      const match = sqliteCount === postgresCount;
      const icon = match ? '✅' : '❌';
      const color = match ? '' : '\x1b[31m';
      const reset = '\x1b[0m';
      
      console.log(\`\${color}\${icon}  \${table.padEnd(20)} SQLite: \${sqliteCount.toString().padStart(5)} | PostgreSQL: \${postgresCount.toString().padStart(5)}\${reset}\`);
    }
    
    console.log('\n✅ Vérification terminée\n');
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message);
  } finally {
    await sqlite.\$disconnect();
    await postgres.end();
  }
}

// ============================================
// 🚀 POINT D'ENTRÉE
// ============================================

if (verify) {
  verifyMigration();
} else {
  migrate();
}
"@

$scriptPath = "scripts/migrate-db.js"
Set-Content -Path $scriptPath -Value $migrationScript -Encoding UTF8
Write-Step "Script généré: $scriptPath" "OK"

# ============================================
# 🎯 EXÉCUTION MIGRATION
# ============================================

Write-Header "EXÉCUTION MIGRATION"

if ($DryRun) {
    Write-Step "Mode DRY RUN activé" "WARN"
    node $scriptPath --dry-run
} elseif ($Verify) {
    Write-Step "Mode VÉRIFICATION activé" ""
    node $scriptPath --verify
} else {
    Write-Host "⚠️  ATTENTION: La migration va commencer!" -ForegroundColor Yellow
    Write-Host "   - Les données PostgreSQL existantes seront écrasées" -ForegroundColor Gray
    Write-Host "   - Un backup SQLite a été créé: $backupFile`n" -ForegroundColor Gray
    
    $confirm = Read-Host "Continuer? (oui/non)"
    
    if ($confirm -eq "oui") {
        Write-Step "Migration en cours..." ""
        node $scriptPath
    } else {
        Write-Step "Migration annulée" "WARN"
        exit 0
    }
}

# ============================================
# 🎉 FINALISATION
# ============================================

Write-Header "PROCHAINES ÉTAPES"

Write-Host "1️⃣  Mettre à jour .env.local:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL=$PostgresUrl`n" -ForegroundColor Gray

Write-Host "2️⃣  Générer le client Prisma:" -ForegroundColor Cyan
Write-Host "   npx prisma generate`n" -ForegroundColor Gray

Write-Host "3️⃣  Tester la connexion:" -ForegroundColor Cyan
Write-Host "   npx prisma studio`n" -ForegroundColor Gray

Write-Host "4️⃣  Mettre à jour imports dans le code:" -ForegroundColor Cyan
Write-Host "   Remplacer: import { prisma } from '@/lib/prisma'" -ForegroundColor Gray
Write-Host "   Par:       import { postgres } from '@/lib/postgres.config'`n" -ForegroundColor Gray

Write-Host "✅ Migration terminée avec succès!`n" -ForegroundColor Green
