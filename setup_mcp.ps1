# 🤖 Render MCP Server - Auto Setup Script (Windows)
# Automatise la configuration MCP pour IAPosteManager

Write-Host "🚀 IAPosteManager - Render MCP Setup" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Vérifier si Cursor est installé
$cursorPath = Get-Command cursor -ErrorAction SilentlyContinue
if (-not $cursorPath) {
    Write-Host "❌ Cursor n'est pas installé. Installez-le depuis https://cursor.sh" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cursor détecté" -ForegroundColor Green

# Créer le répertoire MCP s'il n'existe pas
$mcpDir = "$env:USERPROFILE\.cursor"
if (-not (Test-Path $mcpDir)) {
    New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
}

Write-Host "📁 Répertoire MCP créé : $mcpDir" -ForegroundColor Cyan

# Demander la clé API Render
Write-Host ""
Write-Host "🔑 Configuration de la clé API Render" -ForegroundColor Yellow
Write-Host "1. Allez sur https://dashboard.render.com/account/api-keys"
Write-Host "2. Créez une nouvelle clé API"
Write-Host "3. Copiez la clé (format: rnd_xxxxxxxxxx)"
Write-Host ""
$renderApiKey = Read-Host "Entrez votre clé API Render"

if (-not $renderApiKey.StartsWith("rnd_")) {
    Write-Host "❌ Format de clé invalide. Doit commencer par 'rnd_'" -ForegroundColor Red
    exit 1
}

# Créer le fichier de configuration MCP
$mcpConfig = "$mcpDir\mcp.json"

$configContent = @"
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer $renderApiKey"
      }
    }
  }
}
"@

$configContent | Out-File -FilePath $mcpConfig -Encoding UTF8

Write-Host "✅ Configuration MCP créée : $mcpConfig" -ForegroundColor Green

# Vérifier la configuration
if (Test-Path $mcpConfig) {
    Write-Host "✅ Fichier mcp.json créé avec succès" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Configuration MCP :" -ForegroundColor Cyan
    Write-Host "- Serveur : https://mcp.render.com/mcp"
    Write-Host "- Authentification : Bearer token configuré"
    Write-Host ""
} else {
    Write-Host "❌ Erreur lors de la création du fichier de configuration" -ForegroundColor Red
    exit 1
}

# Instructions finales
Write-Host "🎯 Prochaines étapes :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Redémarrez Cursor pour charger la configuration MCP"
Write-Host "2. Dans Cursor, tapez : 'Set my Render workspace to [VOTRE_WORKSPACE]'"
Write-Host "3. Testez avec : 'List my Render services'"
Write-Host ""
Write-Host "🚀 Commandes IA disponibles :" -ForegroundColor Green
Write-Host "- 'Deploy IAPosteManager to Render'"
Write-Host "- 'Show me service logs'"
Write-Host "- 'Check service metrics'"
Write-Host "- 'Create a PostgreSQL database'"
Write-Host ""
Write-Host "📚 Guide complet : RENDER_MCP_SETUP.md"
Write-Host ""
Write-Host "✅ Setup MCP terminé ! Votre infrastructure Render est maintenant pilotée par IA." -ForegroundColor Green

# Optionnel : ouvrir Cursor
$openCursor = Read-Host "Voulez-vous ouvrir Cursor maintenant ? (y/n)"
if ($openCursor -match "^[Yy]$") {
    Start-Process cursor -ArgumentList "."
    Write-Host "🚀 Cursor ouvert. Testez votre configuration MCP !" -ForegroundColor Green
}