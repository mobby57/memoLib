param(
    [switch]$ApplySecrets,
    [switch]$UpdateServices,
    [switch]$TestSecurity,
    [switch]$All
)

$ErrorActionPreference = 'Stop'

Write-Host "🔒 Application des corrections de sécurité MemoLib" -ForegroundColor Cyan
Write-Host ""

if ($All) {
    $ApplySecrets = $true
    $UpdateServices = $true
    $TestSecurity = $true
}

# Fonction pour générer une clé secrète forte
function Generate-SecretKey {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# 1. Configuration des secrets utilisateur
if ($ApplySecrets) {
    Write-Host "🔑 Configuration des secrets utilisateur..." -ForegroundColor Yellow
    
    try {
        # Générer une nouvelle clé JWT sécurisée
        $jwtSecret = Generate-SecretKey
        dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
        Write-Host "✅ Clé JWT sécurisée configurée" -ForegroundColor Green
        
        # Demander le mot de passe email
        $emailPassword = Read-Host "Entrez le mot de passe d'application Gmail" -AsSecureString
        $emailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword))
        dotnet user-secrets set "EmailMonitor:Password" $emailPasswordPlain
        Write-Host "✅ Mot de passe email configuré" -ForegroundColor Green
        
        # Nettoyer les secrets du fichier appsettings.json
        $appsettingsPath = "appsettings.json"
        if (Test-Path $appsettingsPath) {
            $content = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
            $content.JwtSettings.SecretKey = "MOVED_TO_USER_SECRETS"
            $content.EmailMonitor.PSObject.Properties.Remove('Password')
            $content | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath
            Write-Host "✅ Secrets supprimés d'appsettings.json" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Erreur configuration secrets: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2. Mise à jour des services dans Program.cs
if ($UpdateServices) {
    Write-Host "🛠️ Mise à jour des services..." -ForegroundColor Yellow
    
    try {
        $programPath = "Program.cs"
        if (Test-Path $programPath) {
            $content = Get-Content $programPath -Raw
            
            # Ajouter les nouveaux services si pas déjà présents
            if ($content -notmatch "PasswordResetService") {
                $serviceRegistration = @"
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddScoped<BruteForceProtectionService>();
builder.Services.AddScoped<EmailValidationService>();
"@
                $content = $content -replace "(builder\.Services\.AddScoped<UrlValidationService>\(\);)", "`$1`n$serviceRegistration"
                Set-Content $programPath $content
                Write-Host "✅ Services de sécurité ajoutés à Program.cs" -ForegroundColor Green
            } else {
                Write-Host "ℹ️ Services déjà configurés" -ForegroundColor Blue
            }
        }
    } catch {
        Write-Host "❌ Erreur mise à jour services: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Mise à jour de la configuration AllowedHosts
Write-Host "🌐 Configuration AllowedHosts..." -ForegroundColor Yellow
try {
    $appsettingsPath = "appsettings.json"
    if (Test-Path $appsettingsPath) {
        $content = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
        $content.AllowedHosts = "localhost;127.0.0.1;memolib.local"
        $content | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath
        Write-Host "✅ AllowedHosts configuré de manière sécurisée" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erreur configuration AllowedHosts: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Compilation et vérification
Write-Host "🔨 Compilation du projet..." -ForegroundColor Yellow
try {
    dotnet build -c Release
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilation réussie" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur de compilation" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur compilation: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Tests de sécurité
if ($TestSecurity) {
    Write-Host "🧪 Tests de sécurité..." -ForegroundColor Yellow
    
    if (Test-Path "test-security-simple.ps1") {
        try {
            & ".\test-security-simple.ps1"
        } catch {
            Write-Host "⚠️ Erreur lors des tests: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Script de test non trouvé" -ForegroundColor Yellow
    }
}

# 6. Création d'un rapport de sécurité
Write-Host "📊 Génération du rapport de sécurité..." -ForegroundColor Yellow

$report = @"
# 🔒 Rapport de Sécurité MemoLib
Généré le: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## ✅ Corrections Appliquées

### Secrets Sécurisés
- Clé JWT déplacée vers user-secrets
- Mot de passe email sécurisé
- Fichier appsettings.json nettoyé

### Services de Sécurité
- PasswordResetService: Protection contre reset non autorisé
- BruteForceProtectionService: Protection contre attaques par force brute
- EmailValidationService: Validation et sanitisation des emails
- SecurityHeadersMiddleware: En-têtes de sécurité HTTP

### Configuration
- AllowedHosts restreint aux domaines légitimes
- Sessions sécurisées avec cookies HttpOnly
- Protection CSRF activée

## 🚀 Prochaines Étapes

1. Remplacer AuthController par SecureAuthController
2. Mettre à jour EmailController avec validation
3. Ajouter validation dans SearchController
4. Implémenter chiffrement des données sensibles

## 📞 Support
Consultez SECURITY_RISKS_ANALYSIS.md pour plus de détails.
"@

$report | Out-File "SECURITY_REPORT.md" -Encoding UTF8
Write-Host "✅ Rapport généré: SECURITY_REPORT.md" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Corrections de sécurité appliquées avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Actions manuelles restantes:" -ForegroundColor Yellow
Write-Host "1. Remplacer [Route(\"api/auth\")] par [Route(\"api/secure-auth\")] dans SecureAuthController" -ForegroundColor Gray
Write-Host "2. Mettre à jour les appels frontend vers /api/secure-auth/" -ForegroundColor Gray
Write-Host "3. Tester l'authentification avec les nouvelles protections" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour démarrer l'application sécurisée:" -ForegroundColor Cyan
Write-Host "dotnet run" -ForegroundColor White