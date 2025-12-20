#!/bin/bash

# 🤖 Render MCP Server - Auto Setup Script
# Automatise la configuration MCP pour IAPosteManager

echo "🚀 IAPosteManager - Render MCP Setup"
echo "===================================="

# Vérifier si Cursor est installé
if ! command -v cursor &> /dev/null; then
    echo "❌ Cursor n'est pas installé. Installez-le depuis https://cursor.sh"
    exit 1
fi

echo "✅ Cursor détecté"

# Créer le répertoire MCP s'il n'existe pas
MCP_DIR="$HOME/.cursor"
mkdir -p "$MCP_DIR"

echo "📁 Répertoire MCP créé : $MCP_DIR"

# Demander la clé API Render
echo ""
echo "🔑 Configuration de la clé API Render"
echo "1. Allez sur https://dashboard.render.com/account/api-keys"
echo "2. Créez une nouvelle clé API"
echo "3. Copiez la clé (format: rnd_xxxxxxxxxx)"
echo ""
read -p "Entrez votre clé API Render: " RENDER_API_KEY

if [[ ! $RENDER_API_KEY =~ ^rnd_ ]]; then
    echo "❌ Format de clé invalide. Doit commencer par 'rnd_'"
    exit 1
fi

# Créer le fichier de configuration MCP
MCP_CONFIG="$MCP_DIR/mcp.json"

cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer $RENDER_API_KEY"
      }
    }
  }
}
EOF

echo "✅ Configuration MCP créée : $MCP_CONFIG"

# Vérifier la configuration
if [ -f "$MCP_CONFIG" ]; then
    echo "✅ Fichier mcp.json créé avec succès"
    echo ""
    echo "📋 Configuration MCP :"
    echo "- Serveur : https://mcp.render.com/mcp"
    echo "- Authentification : Bearer token configuré"
    echo ""
else
    echo "❌ Erreur lors de la création du fichier de configuration"
    exit 1
fi

# Instructions finales
echo "🎯 Prochaines étapes :"
echo ""
echo "1. Redémarrez Cursor pour charger la configuration MCP"
echo "2. Dans Cursor, tapez : 'Set my Render workspace to [VOTRE_WORKSPACE]'"
echo "3. Testez avec : 'List my Render services'"
echo ""
echo "🚀 Commandes IA disponibles :"
echo "- 'Deploy IAPosteManager to Render'"
echo "- 'Show me service logs'"
echo "- 'Check service metrics'"
echo "- 'Create a PostgreSQL database'"
echo ""
echo "📚 Guide complet : RENDER_MCP_SETUP.md"
echo ""
echo "✅ Setup MCP terminé ! Votre infrastructure Render est maintenant pilotée par IA."

# Optionnel : ouvrir Cursor
read -p "Voulez-vous ouvrir Cursor maintenant ? (y/n): " OPEN_CURSOR
if [[ $OPEN_CURSOR =~ ^[Yy]$ ]]; then
    cursor .
    echo "🚀 Cursor ouvert. Testez votre configuration MCP !"
fi