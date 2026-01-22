#!/usr/bin/env pwsh
# 🎨 Figma Code Connect - Setup Script
# Automatise l'intégration complète

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║     🎨 IA Poste Manager - Figma Code Connect Setup           ║
║                                                                ║
║  Configuration automatique du sync Figma → Code React         ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ============================================
# 1. Vérifier dépendances
# ============================================

Write-Host "`n[1/5] 🔍 Vérification des dépendances..." -ForegroundColor Yellow

$deps = @(
    "@figma/code-connect",
    "@figma/code-connect-react"
)

$missing = @()
foreach ($dep in $deps) {
    $package = npm list $dep 2>&1 | Select-String "^"
    if ($LASTEXITCODE -ne 0) {
        $missing += $dep
    }
}

if ($missing.Count -gt 0) {
    Write-Host "  ⚠️  Packages manquants:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "     - $_" }
    
    Write-Host "`n  📦 Installation..." -ForegroundColor Cyan
    npm install @figma/code-connect @figma/code-connect-react --save-dev
} else {
    Write-Host "  ✅ Toutes les dépendances sont présentes" -ForegroundColor Green
}

# ============================================
# 2. Vérifier fichiers de config
# ============================================

Write-Host "`n[2/5] 📁 Vérification des fichiers de configuration..." -ForegroundColor Yellow

$files = @(
    "figma.config.json",
    "src/figma.config.ts",
    "Makefile.figma",
    "docs/FIGMA_CODE_CONNECT_GUIDE.md"
)

$missing_files = @()
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        $missing_files += $file
    } else {
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

if ($missing_files.Count -eq 0) {
    Write-Host "  ✅ Tous les fichiers de config sont présents" -ForegroundColor Green
} else {
    Write-Host "  ❌ Fichiers manquants:" -ForegroundColor Red
    $missing_files | ForEach-Object { Write-Host "     - $_" }
}

# ============================================
# 3. Demander informations Figma
# ============================================

Write-Host "`n[3/5] 📋 Configuration Figma..." -ForegroundColor Yellow

$figmaFileId = Read-Host "  → Entrez votre Figma FILE ID (ex: abc123def456)"

if ([string]::IsNullOrWhiteSpace($figmaFileId)) {
    Write-Host "  ⚠️  FILE_ID non fourni. Skipper cette étape." -ForegroundColor Yellow
} else {
    # Mettre à jour la config
    $configContent = @"
{
  "codeConnectConfig": {
    "figmaFile": "https://www.figma.com/file/$figmaFileId/IA-Poste-Manager",
    "sourceDirectory": "./src",
    "outputDirectory": "./docs/figma-exports",
    "autoGenerate": true,
    "syncOnBuild": true
  }
}
"@
    
    $configContent | Set-Content "figma.config.json"
    Write-Host "  ✅ figma.config.json mis à jour" -ForegroundColor Green
}

# ============================================
# 4. Vérifier npm scripts
# ============================================

Write-Host "`n[4/5] 🛠️  Vérification des scripts npm..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" | ConvertFrom-Json

$required_scripts = @(
    "figma:sync",
    "figma:icons",
    "figma:all"
)

$missing_scripts = @()
foreach ($script in $required_scripts) {
    if ($packageJson.scripts.$script) {
        Write-Host "  ✅ npm run $script" -ForegroundColor Green
    } else {
        $missing_scripts += $script
    }
}

if ($missing_scripts.Count -eq 0) {
    Write-Host "  ✅ Tous les scripts npm sont configurés" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Scripts manquants: $($missing_scripts -join ', ')" -ForegroundColor Yellow
}

# ============================================
# 5. Offrir un test
# ============================================

Write-Host "`n[5/5] 🧪 Test optionnel..." -ForegroundColor Yellow

$testChoice = Read-Host "  → Voulez-vous tester la synchronisation maintenant? (y/n)"

if ($testChoice -eq "y") {
    Write-Host "`n  🔄 Exécution: npm run figma:sync..." -ForegroundColor Cyan
    npm run figma:sync
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n  ✅ Sync réussi!" -ForegroundColor Green
        Write-Host "  📄 Fichiers générés en: docs/figma-exports/" -ForegroundColor Green
    } else {
        Write-Host "`n  ❌ Erreur lors de la sync" -ForegroundColor Red
        Write-Host "  💡 Conseil: Vérifiez votre FILE_ID Figma" -ForegroundColor Yellow
    }
}

# ============================================
# Summary
# ============================================

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                    ✅ SETUP COMPLET!                          ║
╚════════════════════════════════════════════════════════════════╝

📚 Documentation:
   → docs/FIGMA_CODE_CONNECT_GUIDE.md (1200+ lignes)
   → FIGMA_SETUP_STATUS.md (checklist complète)

🚀 Prochaines étapes:

   1. Créer Figma file:
      https://www.figma.com/file/$figmaFileId/IA-Poste-Manager

   2. Créer les 4 pages + composants:
      - Smart Forms → SmartFormBuilder
      - Dossiers → DossierCard
      - Workspace → WorkspaceReasoning
      - Dashboards → AnalyticsDashboard

   3. Mettre à jour les NODE_IDs dans:
      - src/components/forms/SmartFormBuilder.figma.tsx
      - src/components/dossiers/DossierCard.figma.tsx
      - src/components/workspace/WorkspaceReasoning.figma.tsx
      - src/app/lawyer/dashboard/dashboard.figma.tsx

   4. Sync depuis Figma:
      npm run figma:sync

   5. Monitorer en dev:
      npm run watch-figma

💡 Commandes utiles:

   npm run figma:sync        # Synchroniser
   npm run figma:all         # Sync + icons
   npm run watch-figma       # Watch mode
   npm run pre-build-figma   # Sync avant build

🔗 Ressources:

   - Figma Developers: https://www.figma.com/developers
   - Code Connect Docs: https://www.figma.com/code-connect
   - GitHub Integration: guides/GITHUB_ACTIONS_FIGMA.md (à créer)

"@ -ForegroundColor Cyan

Write-Host "`n✨ Figma Code Connect ready to use! ✨`n" -ForegroundColor Green
