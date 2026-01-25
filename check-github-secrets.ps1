# ============================================
# Vérification des secrets GitHub Actions
# ============================================

Write-Host "🔍 Vérification des secrets GitHub Actions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Secrets requis
$requiredSecrets = @(
    @{Name="VERCEL_TOKEN"; Required=$true; Description="Token API Vercel"},
    @{Name="VERCEL_ORG_ID"; Required=$true; Description="ID Organisation Vercel"},
    @{Name="VERCEL_PROJECT_ID"; Required=$true; Description="ID Projet Vercel"},
    @{Name="AZURE_STATIC_WEB_APPS_API_TOKEN"; Required=$false; Description="Token Azure SWA (optionnel)"}
)

Write-Host "📋 Secrets requis pour le workflow CI/CD:" -ForegroundColor Yellow
Write-Host ""

foreach ($secret in $requiredSecrets) {
    $status = if ($secret.Required) { "[REQUIS]" } else { "[OPTIONNEL]" }
    $color = if ($secret.Required) { "Red" } else { "DarkYellow" }
    Write-Host "  • $($secret.Name) $status" -ForegroundColor $color
    Write-Host "    Description: $($secret.Description)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📖 Instructions pour configurer les secrets:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Allez sur GitHub: https://github.com/mobby57/iapostemanager/settings/secrets/actions"
Write-Host ""
Write-Host "2. Pour VERCEL_TOKEN:"
Write-Host "   - Allez sur https://vercel.com/account/tokens"
Write-Host "   - Créez un nouveau token"
Write-Host "   - Copiez-le dans GitHub Secrets"
Write-Host ""
Write-Host "3. Pour VERCEL_ORG_ID et VERCEL_PROJECT_ID:"
Write-Host "   - Dans le projet Vercel, allez dans Settings > General"
Write-Host "   - Trouvez 'Project ID' et 'Team ID' (ou votre User ID)"
Write-Host ""
Write-Host "4. Pour AZURE_STATIC_WEB_APPS_API_TOKEN (optionnel):"
Write-Host "   - Dans le portail Azure, ouvrez votre Static Web App"
Write-Host "   - Allez dans 'Manage deployment token'"
Write-Host "   - Copiez le token"
Write-Host ""

# Vérifier si on peut obtenir les infos Vercel localement
Write-Host "🔍 Recherche de configuration Vercel locale..." -ForegroundColor Cyan

if (Test-Path ".vercel/project.json") {
    $vercelConfig = Get-Content ".vercel/project.json" | ConvertFrom-Json
    Write-Host "  ✅ Trouvé! Configuration Vercel locale:" -ForegroundColor Green
    Write-Host "     Project ID: $($vercelConfig.projectId)" -ForegroundColor White
    Write-Host "     Org ID: $($vercelConfig.orgId)" -ForegroundColor White
} else {
    Write-Host "  ⚠️ Pas de configuration Vercel locale (.vercel/project.json)" -ForegroundColor Yellow
    Write-Host "     Exécutez: vercel link" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Nouveau workflow créé: ci-cd-production.yml" -ForegroundColor Green
Write-Host ""
Write-Host "Ce workflow simplifié:" -ForegroundColor White
Write-Host "  ✓ Lint & Type check"
Write-Host "  ✓ Tests unitaires"
Write-Host "  ✓ Build Next.js"
Write-Host "  ✓ Deploy sur Vercel (production)"
Write-Host "  ✓ Deploy sur Azure SWA (optionnel)"
Write-Host "  ✓ Notifications avec summary"
Write-Host ""
Write-Host "Debug mode disponible via workflow_dispatch!" -ForegroundColor Yellow
