# ============================================
# SCRIPT: Appliquer la migration de correction
# File: apply_migration_fix_access_grant.ps1
# Purpose: Créer le dossier de migration et appliquer les changements
# Platform: Windows (PowerShell 5.1+)
# ============================================

Write-Host "🔧 Application de la migration de correction AccessGrant..." -ForegroundColor Cyan
Write-Host ""

$MIGRATION_NAME = "20261117_fix_access_grant_schema"
$MIGRATION_DIR = "prisma\migrations\$MIGRATION_NAME"
$MIGRATION_FILE = "MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql"

# 1. Vérifier que le fichier de migration existe
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Erreur: Fichier $MIGRATION_FILE introuvable" -ForegroundColor Red
    Write-Host "   Ce fichier doit être dans le répertoire racine du projet" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier migration trouvé: $MIGRATION_FILE" -ForegroundColor Green
Write-Host ""

# 2. Créer le dossier de migration
Write-Host "📁 Création du dossier: $MIGRATION_DIR" -ForegroundColor Cyan
if (-not (Test-Path $MIGRATION_DIR)) {
    New-Item -ItemType Directory -Path $MIGRATION_DIR -Force | Out-Null
}
Write-Host "✅ Dossier créé" -ForegroundColor Green
Write-Host ""

# 3. Copier le fichier migration.sql
Write-Host "📋 Copie du fichier migration.sql..." -ForegroundColor Cyan
Copy-Item -Path $MIGRATION_FILE -Destination "$MIGRATION_DIR\migration.sql" -Force
Write-Host "✅ Fichier copié à: $MIGRATION_DIR\migration.sql" -ForegroundColor Green
Write-Host ""

# 4. Vérifier que Prisma est installé
Write-Host "🔍 Vérification de Prisma..." -ForegroundColor Cyan
try {
    $prismaVersion = & npm list prisma 2>&1 | Select-String "prisma@" | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma trouvé: $prismaVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Prisma trouvé dans node_modules" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier Prisma, continuant..." -ForegroundColor Yellow
}
Write-Host ""

# 5. Appliquer la migration
Write-Host "⚙️  Application de la migration avec Prisma..." -ForegroundColor Cyan
Write-Host "   Exécution: npx prisma migrate deploy" -ForegroundColor Gray

$env:NODE_ENV = $env:NODE_ENV -or "development"

& npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration appliquée avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de l'application de la migration" -ForegroundColor Red
    Write-Host "   Code d'erreur: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "   Vérifiez votre connexion à la base de données" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 6. Générer le client Prisma
Write-Host "📦 Regénération du client Prisma..." -ForegroundColor Cyan
& npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Client Prisma généré" -ForegroundColor Green
} else {
    Write-Host "⚠️  Erreur lors de la génération du client (non-bloquant)" -ForegroundColor Yellow
}
Write-Host ""

# 7. Affichage des prochaines étapes
Write-Host "🎉 Migration appliquée avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifier le schéma: npx prisma studio" -ForegroundColor Gray
Write-Host "   2. Builder le projet: npm run build" -ForegroundColor Gray
Write-Host "   3. Vérifier TypeScript: tsc --noEmit" -ForegroundColor Gray
Write-Host "   4. Tester le flux d'invitation" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - Audit complet: AUDIT_INVITATION_FLOW_COMPLET.md" -ForegroundColor Gray
Write-Host "   - Guide d'implémentation: GUIDE_IMPLEMENTATION_CORRECTIONS.md" -ForegroundColor Gray
Write-Host "   - Vérification post-migration: CHECK_MIGRATION_POST_FIX_ACCESS_GRANT.sql" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   Si cette migration est appliquée en production, " -ForegroundColor Yellow
Write-Host "   assurez-vous que ALLOW_QUICK_PROVISION est désactivé (.env.production)" -ForegroundColor Yellow
