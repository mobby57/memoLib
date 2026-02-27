#!/usr/bin/env pwsh
# Configuration Legifrance/PISTE pour MemoLib

Write-Host "🏛️ Configuration Legifrance/PISTE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Vérifier si les clés existent déjà
$existingClientId = dotnet user-secrets get "Legifrance:Sandbox:ClientId" 2>$null
if ($existingClientId) {
    Write-Host "✅ Configuration Legifrance déjà présente" -ForegroundColor Green
    Write-Host "   Client ID: $($existingClientId.Substring(0, 8))..." -ForegroundColor Gray
    
    $overwrite = Read-Host "Voulez-vous reconfigurer ? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Configuration conservée." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "📋 Pour obtenir vos clés PISTE :" -ForegroundColor Yellow
Write-Host "   1. Rendez-vous sur : https://developer.aife.economie.gouv.fr/" -ForegroundColor White
Write-Host "   2. Créez un compte développeur" -ForegroundColor White
Write-Host "   3. Demandez l'accès à l'API Legifrance" -ForegroundColor White
Write-Host "   4. Récupérez vos Client ID et Client Secret" -ForegroundColor White
Write-Host ""

# Demander les informations
Write-Host "🔑 Configuration SANDBOX (développement/test)" -ForegroundColor Cyan
$sandboxClientId = Read-Host "Client ID Sandbox"
$sandboxClientSecret = Read-Host "Client Secret Sandbox" -AsSecureString

Write-Host ""
Write-Host "🔑 Configuration PRODUCTION (optionnel)" -ForegroundColor Cyan
$prodChoice = Read-Host "Configurer la production maintenant ? (y/N)"

if ($prodChoice -eq "y" -or $prodChoice -eq "Y") {
    $prodClientId = Read-Host "Client ID Production"
    $prodClientSecret = Read-Host "Client Secret Production" -AsSecureString
}

# Sauvegarder dans user-secrets
Write-Host ""
Write-Host "💾 Sauvegarde sécurisée..." -ForegroundColor Yellow

try {
    # Sandbox
    dotnet user-secrets set "Legifrance:Sandbox:ClientId" $sandboxClientId
    $sandboxSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sandboxClientSecret))
    dotnet user-secrets set "Legifrance:Sandbox:ClientSecret" $sandboxSecretPlain
    
    # Production (si fourni)
    if ($prodChoice -eq "y" -or $prodChoice -eq "Y") {
        dotnet user-secrets set "Legifrance:Production:ClientId" $prodClientId
        $prodSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($prodClientSecret))
        dotnet user-secrets set "Legifrance:Production:ClientSecret" $prodSecretPlain
    }
    
    # Environnement par défaut
    dotnet user-secrets set "Legifrance:Environment" "sandbox"
    
    Write-Host "✅ Configuration Legifrance sauvegardée !" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur lors de la sauvegarde : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test de connexion
Write-Host ""
Write-Host "🧪 Test de connexion..." -ForegroundColor Yellow

try {
    # Lancer un test simple
    $testResult = dotnet run --project . -- --test-legifrance 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connexion Legifrance réussie !" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Test de connexion échoué - vérifiez vos clés" -ForegroundColor Yellow
        Write-Host "   Vous pourrez tester plus tard avec : dotnet run -- --test-legifrance" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Impossible de tester maintenant - API non démarrée" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Configuration terminée !" -ForegroundColor Green
Write-Host "   Les fonctionnalités Legifrance sont maintenant disponibles :" -ForegroundColor White
Write-Host "   • Recherche CESEDA" -ForegroundColor Gray
Write-Host "   • Consultation d'articles" -ForegroundColor Gray
Write-Host "   • Jurisprudence administrative" -ForegroundColor Gray
Write-Host "   • Journal Officiel" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Pour tester : ./scripts/test-legifrance.ps1" -ForegroundColor Cyan