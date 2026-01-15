#!/usr/bin/env pwsh
# Script de correction immédiate des vulnérabilités

Write-Host "🔒 Correction des vulnérabilités critiques..." -ForegroundColor Cyan

# 1. Audit npm
Write-Host "`n📊 Audit npm..." -ForegroundColor Yellow
npm audit --json | Out-File -FilePath "npm-audit-before.json"

# 2. Correction automatique
Write-Host "`n🔧 Application des corrections..." -ForegroundColor Yellow
npm audit fix --force

# 3. Mise à jour des packages critiques
Write-Host "`n⬆️  Mise à jour des packages..." -ForegroundColor Yellow
npm update

# 4. Vérification post-correction
Write-Host "`n✅ Vérification..." -ForegroundColor Yellow
npm audit --json | Out-File -FilePath "npm-audit-after.json"

# 5. Afficher le résumé
Write-Host "`n📈 Résumé:" -ForegroundColor Green
$before = Get-Content "npm-audit-before.json" | ConvertFrom-Json
$after = Get-Content "npm-audit-after.json" | ConvertFrom-Json

$beforeTotal = $before.metadata.vulnerabilities.total
$afterTotal = $after.metadata.vulnerabilities.total
$fixed = $beforeTotal - $afterTotal

Write-Host "Avant: $beforeTotal vulnérabilités" -ForegroundColor Red
Write-Host "Après: $afterTotal vulnérabilités" -ForegroundColor Green
Write-Host "Corrigées: $fixed vulnérabilités" -ForegroundColor Cyan

# 6. Commit si changements
if (git status --porcelain) {
    Write-Host "`n💾 Commit des corrections..." -ForegroundColor Yellow
    git add package*.json
    git commit -m "fix(deps): auto-fix $fixed security vulnerabilities"
    git push
    Write-Host "✅ Corrections poussées sur GitHub!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun changement à commiter" -ForegroundColor Blue
}

Write-Host "`n🎉 Terminé!" -ForegroundColor Green