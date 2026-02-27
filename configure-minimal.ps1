#!/usr/bin/env pwsh
# Configuration minimale MemoLib - Services gratuits uniquement

Write-Host "🔑 Configuration MemoLib - Services Gratuits" -ForegroundColor Cyan
Write-Host ""

# 1. Gmail App Password
Write-Host "📧 1. Configuration Email (Gmail)" -ForegroundColor Yellow
Write-Host "   Créez un mot de passe d'application: https://myaccount.google.com/apppasswords"
$gmailPassword = Read-Host "   Entrez votre mot de passe d'application Gmail (ou appuyez sur Entrée pour ignorer)"
if ($gmailPassword) {
    dotnet user-secrets set "EmailMonitor:Password" $gmailPassword
    Write-Host "   ✅ Email configuré" -ForegroundColor Green
}

# 2. JWT Secret (auto-généré)
Write-Host ""
Write-Host "🔐 2. Génération JWT Secret" -ForegroundColor Yellow
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
Write-Host "   ✅ JWT Secret généré automatiquement" -ForegroundColor Green

# 3. Telegram Bot (optionnel)
Write-Host ""
Write-Host "💬 3. Configuration Telegram Bot (Optionnel)" -ForegroundColor Yellow
Write-Host "   Créez un bot via @BotFather sur Telegram"
$telegramToken = Read-Host "   Entrez votre Bot Token (ou appuyez sur Entrée pour ignorer)"
if ($telegramToken) {
    dotnet user-secrets set "Telegram:BotToken" $telegramToken
    Write-Host "   ✅ Telegram configuré" -ForegroundColor Green
}

# 4. Legifrance PISTE (optionnel)
Write-Host ""
Write-Host "⚖️ 4. Configuration Legifrance PISTE (Optionnel)" -ForegroundColor Yellow
Write-Host "   Inscription: https://piste.gouv.fr/"
$legifranceId = Read-Host "   Client ID (ou appuyez sur Entrée pour ignorer)"
if ($legifranceId) {
    $legifranceSecret = Read-Host "   Client Secret"
    dotnet user-secrets set "Legifrance:Sandbox:ClientId" $legifranceId
    dotnet user-secrets set "Legifrance:Sandbox:ClientSecret" $legifranceSecret
    Write-Host "   ✅ Legifrance configuré" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Démarrez l'application avec: dotnet run" -ForegroundColor Cyan
Write-Host "🌐 Interface: http://localhost:5078/demo.html" -ForegroundColor Cyan
