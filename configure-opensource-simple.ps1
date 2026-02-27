# Configuration Open Source MemoLib - Services Gratuits Uniquement
# Script PowerShell pour configuration 100% gratuite

Write-Host "Configuration Open Source MemoLib" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Verifier si on est dans le bon repertoire
if (-not (Test-Path "MemoLib.Api.csproj")) {
    Write-Host "Erreur: Executez ce script depuis le repertoire MemoLib.Api" -ForegroundColor Red
    exit 1
}

Write-Host "`nPrincipe: Configuration 100% gratuite sans dependances payantes" -ForegroundColor Cyan

# SERVICES GRATUITS ESSENTIELS

Write-Host "`n1. Gmail App Password (GRATUIT)" -ForegroundColor Yellow
Write-Host "   Guide: https://myaccount.google.com/apppasswords"
$gmailPassword = Read-Host "   Entrez votre mot de passe d'application Gmail"
if ($gmailPassword) {
    dotnet user-secrets set "EmailMonitor:Password" $gmailPassword
    Write-Host "   Gmail configure" -ForegroundColor Green
} else {
    Write-Host "   Gmail requis pour le fonctionnement" -ForegroundColor Yellow
}

Write-Host "`n2. JWT Secrets (GRATUIT)" -ForegroundColor Yellow
$jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
Write-Host "   JWT Secret genere" -ForegroundColor Green

Write-Host "`n3. Telegram Bot (GRATUIT)" -ForegroundColor Yellow
Write-Host "   Creation: Contactez @BotFather sur Telegram"
$telegramToken = Read-Host "   Token du bot (optionnel, ENTER pour ignorer)"
if ($telegramToken) {
    dotnet user-secrets set "Telegram:BotToken" $telegramToken
    Write-Host "   Telegram configure" -ForegroundColor Green
} else {
    Write-Host "   Telegram ignore (notifications par email uniquement)" -ForegroundColor Yellow
}

Write-Host "`n4. Legifrance PISTE (GRATUIT)" -ForegroundColor Yellow
Write-Host "   Inscription: https://piste.gouv.fr/"
$legifranceClientId = Read-Host "   Client ID Sandbox (optionnel, ENTER pour ignorer)"
if ($legifranceClientId) {
    $legifranceClientSecret = Read-Host "   Client Secret Sandbox"
    dotnet user-secrets set "Legifrance:Sandbox:ClientId" $legifranceClientId
    dotnet user-secrets set "Legifrance:Sandbox:ClientSecret" $legifranceClientSecret
    Write-Host "   Legifrance configure" -ForegroundColor Green
} else {
    Write-Host "   Legifrance ignore (recherche juridique desactivee)" -ForegroundColor Yellow
}

# IA LOCALE (OLLAMA)
Write-Host "`n5. Intelligence Artificielle Locale (GRATUIT)" -ForegroundColor Yellow
$setupOllama = Read-Host "   Installer Ollama localement? (Y/n)"
if ($setupOllama -ne "n" -and $setupOllama -ne "N") {
    Write-Host "   Installation d'Ollama..."
    
    try {
        docker --version | Out-Null
        Write-Host "   Docker detecte, installation via Docker..."
        
        docker run -d --name memolib-ollama -p 11434:11434 ollama/ollama
        Start-Sleep 5
        
        docker exec memolib-ollama ollama pull llama2:7b-chat
        
        Write-Host "   Ollama configure (port 11434)" -ForegroundColor Green
        Write-Host "   Modele: llama2:7b-chat installe" -ForegroundColor Cyan
    }
    catch {
        Write-Host "   Docker non disponible" -ForegroundColor Yellow
        Write-Host "   Installez Docker ou telechargez Ollama: https://ollama.ai/" -ForegroundColor Cyan
    }
} else {
    Write-Host "   IA locale ignoree (fonctionnalites IA desactivees)" -ForegroundColor Yellow
}

# CONFIGURATION AI SERVICE
Write-Host "`n6. Configuration AI Service" -ForegroundColor Yellow
$aiServiceEnvPath = "ai-service\.env"

if (-not (Test-Path $aiServiceEnvPath)) {
    if (Test-Path "ai-service\.env.example") {
        Copy-Item "ai-service\.env.example" $aiServiceEnvPath
        Write-Host "   Fichier .env cree depuis l'exemple" -ForegroundColor Green
    }
}

if (Test-Path $aiServiceEnvPath) {
    $envContent = Get-Content $aiServiceEnvPath
    $envContent = $envContent -replace "OPENAI_API_KEY=.*", "# OPENAI_API_KEY=disabled-using-ollama"
    $envContent | Set-Content $aiServiceEnvPath
    
    Write-Host "   AI Service configure pour Ollama local" -ForegroundColor Green
} else {
    Write-Host "   Fichier ai-service/.env non trouve" -ForegroundColor Yellow
}

# RESUME CONFIGURATION
Write-Host "`nRESUME CONFIGURATION OPEN SOURCE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "`nServices configures (GRATUITS):"
Write-Host "   Email: Gmail IMAP/SMTP" -ForegroundColor Green
Write-Host "   Securite: JWT local" -ForegroundColor Green
Write-Host "   Base de donnees: SQLite local" -ForegroundColor Green
Write-Host "   Cache: Memoire local" -ForegroundColor Green
Write-Host "   Stockage: Systeme de fichiers local" -ForegroundColor Green

if ($telegramToken) {
    Write-Host "   Notifications: Telegram" -ForegroundColor Green
}

if ($legifranceClientId) {
    Write-Host "   Juridique: Legifrance PISTE" -ForegroundColor Green
}

Write-Host "`nCout total: 0 euros/mois" -ForegroundColor Green
Write-Host "`nDonnees: 100% locales, aucun cloud requis" -ForegroundColor Green

# PROCHAINES ETAPES
Write-Host "`nPROCHAINES ETAPES" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

Write-Host "`n1. Demarrer l'application:"
Write-Host "   dotnet run" -ForegroundColor Yellow

Write-Host "`n2. Acceder a l'interface:"
Write-Host "   http://localhost:5078" -ForegroundColor Yellow

Write-Host "`n3. Tester les fonctionnalites:"
Write-Host "   - Creer un compte utilisateur" -ForegroundColor Yellow
Write-Host "   - Configurer le monitoring email" -ForegroundColor Yellow
Write-Host "   - Tester l'envoi d'emails" -ForegroundColor Yellow

Write-Host "`nConfiguration Open Source terminee!" -ForegroundColor Green
Write-Host "`nMemoLib fonctionne maintenant 100% en local sans couts recurrents" -ForegroundColor Cyan