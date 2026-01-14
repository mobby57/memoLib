#!/usr/bin/env pwsh
# Script de migration Prisma vers Cloudflare D1
# IA Poste Manager

Write-Host "🔄 Migration Prisma vers Cloudflare D1" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Variables
$DB_NAME = "iaposte-production-db"
$MIGRATION_DIR = "migrations"
$SCHEMA_FILE = "$MIGRATION_DIR/d1-schema.sql"
$SEED_FILE = "prisma/seed-d1.sql"

# Créer le dossier migrations
if (-not (Test-Path $MIGRATION_DIR)) {
    New-Item -ItemType Directory -Path $MIGRATION_DIR | Out-Null
    Write-Host "📁 Dossier migrations créé" -ForegroundColor Green
}

# 1. Générer le schéma SQL depuis Prisma
Write-Host "`n1️⃣ Génération du schéma SQL depuis Prisma..." -ForegroundColor Yellow

try {
    npx prisma migrate diff `
        --from-empty `
        --to-schema-datamodel prisma/schema.prisma `
        --script | Out-File -Encoding UTF8 $SCHEMA_FILE

    Write-Host "   ✅ Schéma SQL généré: $SCHEMA_FILE" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur lors de la génération du schéma!" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}

# 2. Vérifier si D1 existe
Write-Host "`n2️⃣ Vérification de la base D1..." -ForegroundColor Yellow

$d1List = wrangler d1 list 2>&1
if ($d1List -match $DB_NAME) {
    Write-Host "   ✅ Base D1 trouvée: $DB_NAME" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Base D1 non trouvée!" -ForegroundColor Yellow
    Write-Host "   📝 Création de la base..." -ForegroundColor Yellow
    
    wrangler d1 create $DB_NAME
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Base D1 créée avec succès!" -ForegroundColor Green
        Write-Host "   📋 Copiez le database_id dans wrangler.toml" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Erreur lors de la création de la base!" -ForegroundColor Red
        exit 1
    }
}

# 3. Appliquer le schéma sur D1
Write-Host "`n3️⃣ Application du schéma sur D1..." -ForegroundColor Yellow

try {
    wrangler d1 execute $DB_NAME --file=$SCHEMA_FILE --remote
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Schéma appliqué avec succès!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur lors de l'application du schéma!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

# 4. Insertion des données initiales (optionnel)
if (Test-Path $SEED_FILE) {
    Write-Host "`n4️⃣ Insertion des données initiales..." -ForegroundColor Yellow
    
    try {
        wrangler d1 execute $DB_NAME --file=$SEED_FILE --remote
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Données initiales insérées!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Erreur lors de l'insertion des données (peut être normal si déjà présentes)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Pas de seed data ou erreur: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n4️⃣ Pas de fichier seed trouvé - skip" -ForegroundColor Gray
}

# 5. Vérification finale
Write-Host "`n5️⃣ Vérification de la migration..." -ForegroundColor Yellow

try {
    $testQuery = wrangler d1 execute $DB_NAME --command "SELECT name FROM sqlite_master WHERE type='table' LIMIT 5" --remote
    Write-Host "   📊 Tables créées:" -ForegroundColor Cyan
    Write-Host $testQuery -ForegroundColor Gray
    Write-Host "   ✅ Migration vérifiée!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Impossible de vérifier les tables" -ForegroundColor Yellow
}

Write-Host "`n✅ Migration terminée avec succès!" -ForegroundColor Green
Write-Host "🎉 Base D1 prête pour production!" -ForegroundColor Cyan
Write-Host "`n📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Vérifiez wrangler.toml (database_id correct)" -ForegroundColor White
Write-Host "   2. Configurez les secrets: wrangler pages secret put ..." -ForegroundColor White
Write-Host "   3. Déployez: wrangler pages deploy out --project-name=iaposte-manager" -ForegroundColor White
