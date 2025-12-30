# Script de migration vers FastAPI uniquement
# Usage: .\scripts\migrate-to-fastapi.ps1

Write-Host "🚀 Migration vers FastAPI uniquement..." -ForegroundColor Cyan

$legacyDir = "src\backend\flask_legacy"
$movedCount = 0

# Créer dossier legacy
if (-not (Test-Path $legacyDir)) {
    New-Item -ItemType Directory -Path $legacyDir -Force | Out-Null
    Write-Host "✅ Dossier $legacyDir créé" -ForegroundColor Green
}

# Fichiers Flask à déplacer
$flaskFiles = @(
    "src\backend\app.py",
    "src\backend\api.py",
    "src\backend\api_endpoints.py",
    "src\backend\missing_endpoints.py",
    "src\backend\enterprise_features.py",
    "src\backend\security_improvements.py"
)

# Routes Flask à déplacer
$flaskRoutes = @(
    "src\backend\routes\legal_routes.py",
    "src\backend\routes\smtp_routes.py",
    "src\backend\routes\realtime.py",
    "src\backend\routes\vector_stores.py",
    "src\backend\routes\batch.py",
    "src\backend\routes\webhooks.py"
)

# Fichiers JS obsolètes à supprimer
$jsFiles = @(
    "src\backend\routes\auth.js",
    "src\backend\routes\auth-simple.js",
    "src\backend\routes\email.js",
    "src\backend\routes\contacts.js",
    "src\backend\routes\dashboard.js",
    "src\backend\routes\templates.js",
    "src\backend\routes\ia.js",
    "src\backend\routes\ia-simple.js"
)

Write-Host "`n📦 Déplacement des fichiers Flask vers legacy..." -ForegroundColor Yellow

# Déplacer fichiers Flask
foreach ($file in $flaskFiles) {
    if (Test-Path $file) {
        try {
            $dest = Join-Path $legacyDir (Split-Path $file -Leaf)
            Move-Item -Path $file -Destination $dest -Force
            Write-Host "  ✅ Déplacé: $(Split-Path $file -Leaf)" -ForegroundColor Green
            $movedCount++
        } catch {
            Write-Host "  ⚠️  Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Déplacer routes Flask
foreach ($file in $flaskRoutes) {
    if (Test-Path $file) {
        try {
            $dest = Join-Path $legacyDir (Split-Path $file -Leaf)
            Move-Item -Path $file -Destination $dest -Force
            Write-Host "  ✅ Déplacé: $(Split-Path $file -Leaf)" -ForegroundColor Green
            $movedCount++
        } catch {
            Write-Host "  ⚠️  Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🗑️  Suppression des fichiers JS obsolètes..." -ForegroundColor Yellow

# Supprimer fichiers JS
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        try {
            Remove-Item -Path $file -Force
            Write-Host "  ✅ Supprimé: $(Split-Path $file -Leaf)" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Créer fichier README dans legacy
$readmeContent = @"
# Flask Legacy Files

Ce dossier contient les anciens fichiers Flask qui ont été remplacés par FastAPI.

## Fichiers

- `app.py` - Ancienne application Flask principale (5765 lignes)
- `api.py` - API Flask alternative
- `api_endpoints.py` - Endpoints Flask
- `legal_routes.py` - Routes légales Flask
- `smtp_routes.py` - Routes SMTP Flask
- `realtime.py` - Routes temps réel Flask
- `vector_stores.py` - Vector stores Flask
- `batch.py` - Batch API Flask
- `webhooks.py` - Webhooks Flask

## Migration

Ces fichiers ont été migrés vers FastAPI dans :
- `src/backend/main_fastapi.py` - Point d'entrée principal
- `src/backend/routes/` - Routes FastAPI

## Suppression

Ces fichiers peuvent être supprimés après validation complète de la migration.

**Date de migration:** $(Get-Date -Format "yyyy-MM-dd")
"@

Set-Content -Path "$legacyDir\README.md" -Value $readmeContent

Write-Host "`n📊 Résumé:" -ForegroundColor Cyan
Write-Host "  ✅ $movedCount fichier(s) déplacé(s) vers legacy" -ForegroundColor Green
Write-Host "  ✅ Fichiers JS obsolètes supprimés" -ForegroundColor Green
Write-Host "`n✨ Migration terminée!" -ForegroundColor Green
Write-Host "`n💡 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Vérifier que main_fastapi.py contient toutes les routes nécessaires" -ForegroundColor White
Write-Host "  2. Tester les endpoints API" -ForegroundColor White
Write-Host "  3. Supprimer flask_legacy/ après validation" -ForegroundColor White


