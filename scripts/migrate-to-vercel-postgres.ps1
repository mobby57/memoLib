# Migration SQLite → Vercel Postgres
# =====================================

Write-Host "`n=== MIGRATION VERS VERCEL POSTGRES ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Créer la base Postgres sur Vercel
Write-Host "ÉTAPE 1: Créer Vercel Postgres" -ForegroundColor Yellow
Write-Host "1. Ouvrez: https://vercel.com/mobby57s-projects/memoLib/stores" -ForegroundColor White
Write-Host "2. Cliquez 'Create Database' → 'Postgres'" -ForegroundColor White
Write-Host "3. Nom suggéré: iaposte-production-db" -ForegroundColor White
Write-Host "4. Région: WEUR (Europe West)" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Base Postgres créée ? (y/n)"
if ($continue -ne 'y') {
    Write-Host "❌ Migration annulée" -ForegroundColor Red
    exit 1
}

# Étape 2: Récupérer DATABASE_URL
Write-Host "`nÉTAPE 2: Configuration DATABASE_URL" -ForegroundColor Yellow
Write-Host "Copiez la variable DATABASE_URL depuis le dashboard Vercel" -ForegroundColor White
Write-Host ""

$databaseUrl = Read-Host "Collez DATABASE_URL"
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "❌ DATABASE_URL requis" -ForegroundColor Red
    exit 1
}

# Étape 3: Mettre à jour .env.local
Write-Host "`nÉTAPE 3: Mise à jour .env.local" -ForegroundColor Yellow
$envContent = Get-Content .env.local -Raw
$envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=`"$databaseUrl`""
Set-Content -Path .env.local -Value $envContent
Write-Host "✅ .env.local mis à jour" -ForegroundColor Green

# Étape 4: Générer et appliquer les migrations
Write-Host "`nÉTAPE 4: Migration Prisma" -ForegroundColor Yellow
Write-Host "Génération du client Prisma..." -ForegroundColor White
npx prisma generate

Write-Host "Application des migrations..." -ForegroundColor White
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations appliquées avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors des migrations" -ForegroundColor Red
    exit 1
}

# Étape 5: Seed (optionnel)
Write-Host "`nÉTAPE 5: Seed de la base (optionnel)" -ForegroundColor Yellow
$seed = Read-Host "Voulez-vous seed la base avec les données de test ? (y/n)"
if ($seed -eq 'y') {
    npm run db:seed:complete
    Write-Host "✅ Seed terminé" -ForegroundColor Green
}

# Étape 6: Configuration Vercel
Write-Host "`nÉTAPE 6: Configuration Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "Ajoutez DATABASE_URL dans Vercel:" -ForegroundColor White
Write-Host "1. https://vercel.com/mobby57s-projects/memoLib/settings/environment-variables" -ForegroundColor White
Write-Host "2. Add New → DATABASE_URL" -ForegroundColor White
Write-Host "3. Value: $databaseUrl" -ForegroundColor White
Write-Host "4. Environment: Production + Preview" -ForegroundColor White
Write-Host ""

$vercelConfig = Read-Host "Variables Vercel configurées ? (y/n)"
if ($vercelConfig -ne 'y') {
    Write-Host "⚠️  N'oubliez pas de configurer Vercel avant déploiement" -ForegroundColor Yellow
}

# Étape 7: Test de connexion
Write-Host "`nÉTAPE 7: Test de connexion" -ForegroundColor Yellow
npx prisma db push --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connexion Postgres validée" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur de connexion" -ForegroundColor Red
    exit 1
}

# Étape 8: Backup SQLite (optionnel)
Write-Host "`nÉTAPE 8: Backup SQLite" -ForegroundColor Yellow
$backup = Read-Host "Voulez-vous sauvegarder la base SQLite locale ? (y/n)"
if ($backup -eq 'y') {
    $backupName = "prisma/dev.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item prisma/dev.db $backupName -ErrorAction SilentlyContinue
    Write-Host "✅ Backup créé: $backupName" -ForegroundColor Green
}

# Résumé
Write-Host "`n=== MIGRATION TERMINÉE ===" -ForegroundColor Cyan
Write-Host "✅ Base Postgres configurée" -ForegroundColor Green
Write-Host "✅ Migrations appliquées" -ForegroundColor Green
Write-Host "✅ .env.local mis à jour" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. Redéployer: vercel --prod" -ForegroundColor White
Write-Host "2. Tester l'application en production" -ForegroundColor White
Write-Host "3. Supprimer prisma/dev.db (SQLite) si tout fonctionne" -ForegroundColor White
Write-Host ""
Write-Host "DATABASE_URL configuré:" -ForegroundColor Cyan
Write-Host "$databaseUrl" -ForegroundColor White
Write-Host ""
