#!/usr/bin/env pwsh
# Script de correction immediate des vulnerabilites

Write-Output "[INFO] Correction des vulnerabilites critiques..."

# 1. Audit npm
Write-Output ""
Write-Output "[STEP 1] Audit npm..."
npm audit --json | Out-File -FilePath "npm-audit-before.json"

# 2. Correction automatique
Write-Output ""
Write-Output "[STEP 2] Application des corrections..."
npm audit fix --force

# 3. Mise a jour des packages critiques
Write-Output ""
Write-Output "[STEP 3] Mise a jour des packages..."
npm update

# 4. Verification post-correction
Write-Output ""
Write-Output "[STEP 4] Verification..."
npm audit --json | Out-File -FilePath "npm-audit-after.json"

# 5. Afficher le resume
Write-Output ""
Write-Output "[INFO] Resume:"

try {
    $before = Get-Content "npm-audit-before.json" | ConvertFrom-Json
    $after = Get-Content "npm-audit-after.json" | ConvertFrom-Json
    
    $beforeTotal = $before.metadata.vulnerabilities.total
    $afterTotal = $after.metadata.vulnerabilities.total
    $fixed = $beforeTotal - $afterTotal
    
    Write-Output "   Avant: $beforeTotal vulnerabilites"
    Write-Output "   Apres: $afterTotal vulnerabilites"
    Write-Output "   Corrigees: $fixed vulnerabilites"
} catch {
    Write-Output "   Impossible de parser les resultats"
}

# 6. Commit si changements
if (git status --porcelain) {
    Write-Output ""
    Write-Output "[STEP 5] Commit des corrections..."
    git add package*.json
    git commit -m "fix(deps): auto-fix security vulnerabilities"
    git push
    Write-Output "[OK] Corrections poussees sur GitHub!"
} else {
    Write-Output "[INFO] Aucun changement a commiter"
}

Write-Output ""
Write-Output "[OK] Termine!"
