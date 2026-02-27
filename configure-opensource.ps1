# =============================================================================
# Configuration Open Source MemoLib - Services Gratuits Uniquement
# =============================================================================
# Script PowerShell pour configuration 100% gratuite
# =============================================================================

Write-Host "🆓 Configuration Open Source MemoLib" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "MemoLib.Api.csproj")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis le répertoire MemoLib.Api" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Principe: Configuration 100% gratuite sans dépendances payantes" -ForegroundColor Cyan

# =============================================================================
# SERVICES GRATUITS ESSENTIELS
# =============================================================================

Write-Host "`n📧 1. Gmail App Password (GRATUIT)" -ForegroundColor Yellow
Write-Host "   Guide: https://myaccount.google.com/apppasswords"
$gmailPassword = Read-Host "   Entrez votre mot de passe d'application Gmail"
if ($gmailPassword) {
    dotnet user-secrets set "EmailMonitor:Password" $gmailPassword
    Write-Host "   ✅ Gmail configuré" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Gmail requis pour le fonctionnement" -ForegroundColor Yellow
}

Write-Host "`n🔑 2. JWT Secrets (GRATUIT)" -ForegroundColor Yellow
$jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
dotnet user-secrets set "JwtSettings:SecretKey" $jwtSecret
Write-Host "   ✅ JWT Secret généré" -ForegroundColor Green

Write-Host "`n💬 3. Telegram Bot (GRATUIT)" -ForegroundColor Yellow
Write-Host "   Création: Contactez @BotFather sur Telegram"
$telegramToken = Read-Host "   Token du bot (optionnel, ENTER pour ignorer)"
if ($telegramToken) {
    dotnet user-secrets set "Telegram:BotToken" $telegramToken
    Write-Host "   ✅ Telegram configuré" -ForegroundColor Green
} else {
    Write-Host "   ⏭️ Telegram ignoré (notifications par email uniquement)" -ForegroundColor Yellow
}

Write-Host "`n⚖️ 4. Legifrance PISTE (GRATUIT)" -ForegroundColor Yellow
Write-Host "   Inscription: https://piste.gouv.fr/"
$legifranceClientId = Read-Host "   Client ID Sandbox (optionnel, ENTER pour ignorer)"
if ($legifranceClientId) {
    $legifranceClientSecret = Read-Host "   Client Secret Sandbox"
    dotnet user-secrets set "Legifrance:Sandbox:ClientId" $legifranceClientId
    dotnet user-secrets set "Legifrance:Sandbox:ClientSecret" $legifranceClientSecret
    Write-Host "   ✅ Legifrance configuré" -ForegroundColor Green
} else {
    Write-Host "   ⏭️ Legifrance ignoré (recherche juridique désactivée)" -ForegroundColor Yellow
}

# =============================================================================
# IA LOCALE (OLLAMA)
# =============================================================================

Write-Host "`n🤖 5. Intelligence Artificielle Locale (GRATUIT)" -ForegroundColor Yellow
$setupOllama = Read-Host "   Installer Ollama localement? (Y/n)"
if ($setupOllama -ne "n" -and $setupOllama -ne "N") {
    Write-Host "   📥 Installation d'Ollama..."
    
    # Vérifier si Docker est disponible
    try {
        docker --version | Out-Null
        Write-Host "   🐳 Docker détecté, installation via Docker..."
        
        # Démarrer Ollama
        docker run -d --name memolib-ollama -p 11434:11434 ollama/ollama
        Start-Sleep 5
        
        # Télécharger un modèle léger
        docker exec memolib-ollama ollama pull llama2:7b-chat
        
        Write-Host "   ✅ Ollama configuré (port 11434)" -ForegroundColor Green
        Write-Host "   💡 Modèle: llama2:7b-chat installé" -ForegroundColor Cyan
    }
    catch {
        Write-Host "   ⚠️ Docker non disponible" -ForegroundColor Yellow
        Write-Host "   💡 Installez Docker ou téléchargez Ollama: https://ollama.ai/" -ForegroundColor Cyan
        Write-Host "   📝 Commande manuelle: ollama serve" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⏭️ IA locale ignorée (fonctionnalités IA désactivées)" -ForegroundColor Yellow
}

# =============================================================================
# CONFIGURATION AI SERVICE
# =============================================================================

Write-Host "`n⚙️ 6. Configuration AI Service" -ForegroundColor Yellow
$aiServiceEnvPath = "ai-service\.env"

if (-not (Test-Path $aiServiceEnvPath)) {
    if (Test-Path "ai-service\.env.example") {
        Copy-Item "ai-service\.env.example" $aiServiceEnvPath
        Write-Host "   📄 Fichier .env créé depuis l'exemple" -ForegroundColor Green
    }
}

if (Test-Path $aiServiceEnvPath) {
    # Configuration pour Ollama local
    $envContent = Get-Content $aiServiceEnvPath
    $envContent = $envContent -replace "OPENAI_API_KEY=.*", "# OPENAI_API_KEY=disabled-using-ollama"
    $envContent = $envContent -replace "# OLLAMA_BASE_URL=.*", "OLLAMA_BASE_URL=http://localhost:11434"
    $envContent | Set-Content $aiServiceEnvPath
    
    Write-Host "   ✅ AI Service configuré pour Ollama local" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Fichier ai-service/.env non trouvé" -ForegroundColor Yellow
}

# =============================================================================
# RÉSUMÉ CONFIGURATION
# =============================================================================

Write-Host "`n📋 RÉSUMÉ CONFIGURATION OPEN SOURCE" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

Write-Host "`n✅ Services configurés (GRATUITS):"
Write-Host "   📧 Email: Gmail IMAP/SMTP" -ForegroundColor Green
Write-Host "   🔑 Sécurité: JWT local" -ForegroundColor Green
Write-Host "   🗄️ Base de données: SQLite local" -ForegroundColor Green
Write-Host "   💾 Cache: Mémoire local" -ForegroundColor Green
Write-Host "   📁 Stockage: Système de fichiers local" -ForegroundColor Green

if ($telegramToken) {
    Write-Host "   💬 Notifications: Telegram" -ForegroundColor Green
}

if ($legifranceClientId) {
    Write-Host "   ⚖️ Juridique: Legifrance PISTE" -ForegroundColor Green
}

try {
    docker ps --filter "name=memolib-ollama" --format "table {{.Names}}" | Out-Null
    Write-Host "   🤖 IA: Ollama local (llama2)" -ForegroundColor Green
} catch {
    Write-Host "   🤖 IA: Non configurée" -ForegroundColor Yellow
}

Write-Host "`n💰 Coût total: 0€/mois" -ForegroundColor Green
Write-Host "`n🔒 Données: 100% locales, aucun cloud requis" -ForegroundColor Green

# =============================================================================
# PROCHAINES ÉTAPES
# =============================================================================

Write-Host "`n🚀 PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

Write-Host "`n1. Démarrer l'application:"
Write-Host "   dotnet run" -ForegroundColor Yellow

Write-Host "`n2. Accéder à l'interface:"
Write-Host "   http://localhost:5078" -ForegroundColor Yellow

Write-Host "`n3. Tester les fonctionnalités:"
Write-Host "   - Créer un compte utilisateur" -ForegroundColor Yellow
Write-Host "   - Configurer le monitoring email" -ForegroundColor Yellow
Write-Host "   - Tester l'envoi d'emails" -ForegroundColor Yellow

if ($telegramToken) {
    Write-Host "   - Tester les notifications Telegram" -ForegroundColor Yellow
}

Write-Host "`n4. Monitoring local:"
Write-Host "   docker-compose up -d  # Grafana + Prometheus" -ForegroundColor Yellow
Write-Host "   http://localhost:3001  # Grafana (admin/admin123)" -ForegroundColor Yellow

Write-Host "`n📚 Documentation:"
Write-Host "   - README.md" -ForegroundColor Yellow
Write-Host "   - CLES_ENV_EXTERNES_MANQUANTES.md" -ForegroundColor Yellow

Write-Host "`n✅ Configuration Open Source terminée!" -ForegroundColor Green
Write-Host "`n🎯 MemoLib fonctionne maintenant 100% en local sans coûts récurrents" -ForegroundColor Cyan