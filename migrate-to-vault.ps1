# Migration vers Vault - PowerShell
Write-Host "========================================"
Write-Host "MIGRATION AUTOMATIQUE VERS VAULT"
Write-Host "========================================"
Write-Host ""

$API_URL = "http://localhost:5078"
$DEMO_EMAIL = "vault-demo-$(Get-Date -Format 'yyyyMMddHHmmss')@memolib.local"
$DEMO_PASSWORD = "Demo2025!"

# Ignorer les erreurs SSL (certificat auto-signé)
if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type) {
    $certCallback = @"
        using System;
        using System.Net;
        using System.Net.Security;
        using System.Security.Cryptography.X509Certificates;
        public class ServerCertificateValidationCallback {
            public static void Ignore() {
                ServicePointManager.ServerCertificateValidationCallback += 
                    delegate (
                        Object obj, 
                        X509Certificate certificate, 
                        X509Chain chain, 
                        SslPolicyErrors errors
                    ) {
                        return true;
                    };
            }
        }
"@
    Add-Type $certCallback
}
[ServerCertificateValidationCallback]::Ignore()

# 1. Créer/Login compte demo
Write-Host "Etape 1: Creation compte demo ($DEMO_EMAIL)..."
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -ContentType "application/json" -Body "{`"email`":`"$DEMO_EMAIL`",`"password`":`"$DEMO_PASSWORD`",`"name`":`"Vault Demo`"}" -ErrorAction Stop
    Write-Host "Compte cree" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "Compte existe deja (OK)" -ForegroundColor Yellow
    } else {
        Write-Host "Erreur creation: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Verifiez que l'API est demarree sur $API_URL" -ForegroundColor Yellow
        pause
        exit 1
    }
}

# 2. Login et récupérer token
Write-Host "Etape 2: Recuperation token..."
try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method Post -ContentType "application/json" -Body "{`"email`":`"$DEMO_EMAIL`",`"password`":`"$DEMO_PASSWORD`"}"
    $token = $loginResponse.token
    Write-Host "Token obtenu: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "ERREUR LOGIN: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifiez que l'API est demarree sur $API_URL" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host ""

# Test 6: Vault Service
Write-Host "Etape 3: Migration vers Vault..."

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# EmailMonitor:Password
try {
    Invoke-RestMethod -Uri "$API_URL/api/vault/store" -Method Post -Headers $headers -Body '{"key":"EmailMonitor:Password","value":"xxbz dbcr sgxp ncuw","category":"EmailConfig"}' -ErrorAction Stop | Out-Null
    Write-Host "  - EmailMonitor:Password stocke" -ForegroundColor Green
} catch {
    Write-Host "  - EmailMonitor:Password ERREUR" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "    Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

# DemoAccount:Password
try {
    Invoke-RestMethod -Uri "$API_URL/api/vault/store" -Method Post -Headers $headers -Body '{"key":"DemoAccount:Password","value":"Demo2025!","category":"Demo"}' -ErrorAction Stop | Out-Null
    Write-Host "  - DemoAccount:Password stocke" -ForegroundColor Green
} catch {
    Write-Host "  - DemoAccount:Password ERREUR" -ForegroundColor Red
}

# PublicContact:Password
try {
    Invoke-RestMethod -Uri "$API_URL/api/vault/store" -Method Post -Headers $headers -Body '{"key":"PublicContact:Password","value":"xxbz dbcr sgxp ncuw","category":"EmailConfig"}' -ErrorAction Stop | Out-Null
    Write-Host "  - PublicContact:Password stocke" -ForegroundColor Green
} catch {
    Write-Host "  - PublicContact:Password ERREUR" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================"
Write-Host "MIGRATION TERMINEE"
Write-Host "========================================"
Write-Host ""
Write-Host "Secrets stockes dans le Vault:"
Write-Host "- EmailMonitor:Password"
Write-Host "- DemoAccount:Password"
Write-Host "- PublicContact:Password"
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
