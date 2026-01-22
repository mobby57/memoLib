# ============================================
# Configuration des Variables Cloudflare Pages
# ============================================

param(
    [string]$Environment = "production"
)

Write-Host "🔐 Configuration des Variables Cloudflare Pages" -ForegroundColor Cyan
Write-Host "Environnement: $Environment" -ForegroundColor Yellow

# Lire les variables depuis .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Fichier $envFile non trouvé" -ForegroundColor Red
    exit 1
}

# Extraire les variables critiques
$lines = Get-Content $envFile
$vars = @{}
foreach ($line in $lines) {
    if ($line -match '^\s*([A-Z_]+)=(.*)$') {
        $vars[$matches[1]] = $matches[2]
    }
}

# Variables à configurer
$secretsToSet = @{
    'DATABASE_URL' = $vars['DATABASE_URL']
    'NEXTAUTH_SECRET' = $vars['NEXTAUTH_SECRET']
    'NEXTAUTH_URL' = "https://iapostemanage.pages.dev"
    'OLLAMA_BASE_URL' = $vars['OLLAMA_BASE_URL'] ?? "http://localhost:11434"
    'OLLAMA_MODEL' = $vars['OLLAMA_MODEL'] ?? "llama3.2:3b"
}

# Afficher les secrets à configurer
Write-Host "`n📋 VARIABLES À CONFIGURER:" -ForegroundColor Green
foreach ($key in $secretsToSet.Keys) {
    $value = $secretsToSet[$key]
    if ($value -like "*password*" -or $value -like "*secret*" -or $value -like "*key*") {
        Write-Host "$key : [REDACTED]"
    } else {
        Write-Host "$key : $value"
    }
}

# Instructions d'accès au dashboard
Write-Host "`n🌍 ACCÈS CLOUDFLARE DASHBOARD:" -ForegroundColor Cyan
Write-Host "https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/iapostemanage" -ForegroundColor Blue

Write-Host "`n📝 ÉTAPES DE CONFIGURATION MANUELLE:" -ForegroundColor Yellow
Write-Host "1. Allez sur le dashboard Cloudflare Pages"
Write-Host "2. Cliquez sur 'iapostemanage' → Settings → Environment variables"
Write-Host "3. Cliquez sur $([char]34)Production$([char]34)"
Write-Host "4. Ajoutez les variables suivantes:"
Write-Host ""

$count = 1
foreach ($key in $secretsToSet.Keys) {
    $value = $secretsToSet[$key]
    Write-Host "$count. Variable: $key"
    Write-Host "   Value: $value"
    Write-Host ""
    $count++
}

Write-Host "5. Cliquez sur $([char]34)Save and Deploy$([char]34)"
Write-Host ""
Write-Host "✅ Configuration terminée !" -ForegroundColor Green

# Offrir d'utiliser wrangler (optionnel)
Write-Host "`n❓ Alternative: Utiliser Wrangler CLI?" -ForegroundColor Cyan
Write-Host "Si vous avez Wrangler configuré, exécutez:" -ForegroundColor Gray
Write-Host "npx wrangler pages secret put DATABASE_URL" -ForegroundColor Green
Write-Host "npx wrangler pages secret put NEXTAUTH_SECRET" -ForegroundColor Green
Write-Host ""
