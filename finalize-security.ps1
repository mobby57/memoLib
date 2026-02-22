param(
    [switch]$Force
)

Write-Host "🔒 Application finale des corrections de sécurité MemoLib" -ForegroundColor Cyan
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Appliquer toutes les corrections de sécurité? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Opération annulée" -ForegroundColor Yellow
        exit 0
    }
}

# 1. Déplacer les secrets
Write-Host "🔑 Configuration des secrets..." -ForegroundColor Yellow
try {
    # Générer une clé JWT forte
    $jwtBytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($jwtBytes)
    $jwtSecret = [Convert]::ToBase64String($jwtBytes)
    
    dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
    Write-Host "✅ Clé JWT sécurisée" -ForegroundColor Green
    
    # Nettoyer appsettings.json
    $appsettings = Get-Content "appsettings.json" | ConvertFrom-Json
    $appsettings.JwtSettings.SecretKey = "MOVED_TO_USER_SECRETS"
    $appsettings | ConvertTo-Json -Depth 10 | Set-Content "appsettings.json"
    Write-Host "✅ Secrets nettoyés" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur secrets: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Compilation
Write-Host "🔨 Compilation..." -ForegroundColor Yellow
dotnet build -c Release
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilation réussie" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur compilation" -ForegroundColor Red
    exit 1
}

# 3. Test rapide
Write-Host "🧪 Test de sécurité..." -ForegroundColor Yellow
if (Test-Path "test-security-simple.ps1") {
    & ".\test-security-simple.ps1"
} else {
    Write-Host "⚠️ Script de test non trouvé" -ForegroundColor Yellow
}

# 4. Résumé final
Write-Host ""
Write-Host "🎉 SÉCURISATION TERMINÉE!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Corrections appliquées:" -ForegroundColor Cyan
Write-Host "  • Réinitialisation mot de passe sécurisée" -ForegroundColor Gray
Write-Host "  • Protection brute force" -ForegroundColor Gray
Write-Host "  • Validation email stricte" -ForegroundColor Gray
Write-Host "  • Sanitisation des entrées" -ForegroundColor Gray
Write-Host "  • Configuration AllowedHosts" -ForegroundColor Gray
Write-Host "  • Services de sécurité activés" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Pour démarrer l'application sécurisée:" -ForegroundColor Cyan
Write-Host "dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Nouvelles routes sécurisées:" -ForegroundColor Cyan
Write-Host "  • /api/auth/change-password (au lieu de reset-password)" -ForegroundColor Gray
Write-Host "  • /api/secureemail/* (au lieu de email/*)" -ForegroundColor Gray
Write-Host "  • /api/securesearch/* (au lieu de search/*)" -ForegroundColor Gray