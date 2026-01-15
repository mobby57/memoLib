#!/usr/bin/env pwsh
# Validation de tous les workflows avancés
# IA Poste Manager

Write-Host ""
Write-Host "🚀 VALIDATION DE TOUS LES WORKFLOWS AVANCÉS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Lancer le script TypeScript
npx tsx scripts/validate-all-workflows.ts

Write-Host ""
Write-Host "✨ Validation terminée!" -ForegroundColor Green
Write-Host ""
