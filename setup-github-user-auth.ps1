# Configuration GitHub User-to-Server Authentication
# Ce script aide à configurer l'authentification utilisateur

Write-Host "🔐 GitHub User-to-Server Authentication - Configuration" -ForegroundColor Cyan
Write-Host ""

# Vérifier si .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Fichier .env.local non trouvé" -ForegroundColor Yellow
    Write-Host "📝 Création depuis .env.local.example..." -ForegroundColor Gray
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "✅ Fichier .env.local créé" -ForegroundColor Green
    Write-Host ""
}

# Lire le fichier .env.local
$envContent = Get-Content ".env.local" -Raw

# Vérifier les variables critiques
Write-Host "📋 Vérification de la configuration:" -ForegroundColor Cyan
Write-Host ""

$checks = @(
    @{
        Name = "GITHUB_APP_ID"
        Pattern = "GITHUB_APP_ID=(\d+)"
        Required = $true
    },
    @{
        Name = "GITHUB_CLIENT_ID"
        Pattern = "GITHUB_CLIENT_ID=(Iv\w+)"
        Required = $true
    },
    @{
        Name = "GITHUB_CLIENT_SECRET"
        Pattern = "GITHUB_CLIENT_SECRET=(\w+)"
        Required = $true
    },
    @{
        Name = "GITHUB_CALLBACK_URL"
        Pattern = "GITHUB_CALLBACK_URL=(https?://[^\s]+)"
        Required = $true
    }
)

$allValid = $true

foreach ($check in $checks) {
    if ($envContent -match $check.Pattern) {
        $value = $Matches[1]
        if ($value -match "your-|example") {
            Write-Host "  ❌ $($check.Name): À configurer" -ForegroundColor Red
            $allValid = $false
        } else {
            if ($check.Name -eq "GITHUB_CLIENT_SECRET") {
                Write-Host "  ✅ $($check.Name): Configuré" -ForegroundColor Green
            } else {
                Write-Host "  ✅ $($check.Name): $value" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ❌ $($check.Name): Manquant" -ForegroundColor Red
        $allValid = $false
    }
}

Write-Host ""

if ($allValid) {
    Write-Host "✅ Configuration complète!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Lancement du test..." -ForegroundColor Cyan
    npx tsx scripts/test-github-user-auth.ts
} else {
    Write-Host "⚠️  Configuration incomplète" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Étapes à suivre:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Aller sur: https://github.com/settings/apps" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Sélectionner votre application GitHub" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Activer 'Request user authorization (OAuth) during installation'" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Configurer Callback URL:" -ForegroundColor White
    Write-Host "   http://localhost:3000/api/auth/callback/github" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Copier Client ID et Client Secret dans .env.local" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Relancer ce script pour vérifier" -ForegroundColor White
    Write-Host ""
    
    # Proposer d'ouvrir le fichier .env.local
    $openFile = Read-Host "Voulez-vous ouvrir .env.local maintenant? (y/n)"
    if ($openFile -eq "y") {
        code .env.local
    }
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - Guide complet: GITHUB_USER_AUTH.md" -ForegroundColor Gray
Write-Host "  - Demarrage rapide: GITHUB_USER_AUTH_QUICKSTART.md" -ForegroundColor Gray
Write-Host ""
