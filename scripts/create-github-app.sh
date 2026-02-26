#!/bin/bash

# Script automatisé pour créer une GitHub App avec GitHub CLI
# Usage: ./scripts/create-github-app.sh

set -e

echo "🚀 Création automatique de la GitHub App - IA Poste Manager"

# Variables de configuration
APP_NAME="IA Poste Manager"
DESCRIPTION="Assistant juridique digital CESEDA - Gestion sécurisée multi-tenant"
HOMEPAGE_URL="https://your-domain.com"
CALLBACK_URL="https://your-domain.com/api/auth/callback/github"
WEBHOOK_URL="https://your-domain.com/api/webhooks/github"

# Générer le secret webhook
WEBHOOK_SECRET="whsec_$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo "🔑 Secret webhook généré: $WEBHOOK_SECRET"

# Créer le fichier de configuration temporaire
cat > /tmp/github-app-config.json << EOF
{
  "name": "$APP_NAME",
  "description": "$DESCRIPTION",
  "url": "$HOMEPAGE_URL",
  "callback_urls": ["$CALLBACK_URL"],
  "webhook_url": "$WEBHOOK_URL",
  "webhook_secret": "$WEBHOOK_SECRET",
  "public": true,
  "default_permissions": {
    "contents": "write",
    "issues": "write",
    "metadata": "read",
    "pull_requests": "write"
  },
  "default_events": [
    "issues",
    "issue_comment",
    "pull_request",
    "pull_request_review",
    "push",
    "repository"
  ]
}
EOF

# Créer la GitHub App
echo "📱 Création de la GitHub App..."
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /user/apps \
  --input /tmp/github-app-config.json > /tmp/app-response.json

# Extraire les informations importantes
APP_ID=$(jq -r '.id' /tmp/app-response.json)
CLIENT_ID=$(jq -r '.client_id' /tmp/app-response.json)
APP_SLUG=$(jq -r '.slug' /tmp/app-response.json)

echo "✅ GitHub App créée avec succès!"
echo "📋 App ID: $APP_ID"
echo "📋 Client ID: $CLIENT_ID"
echo "📋 App Slug: $APP_SLUG"

# Générer une clé privée
echo "🔐 Génération de la clé privée..."
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /apps/$APP_ID/private-keys > /tmp/private-key-response.json

# Sauvegarder la clé privée
PRIVATE_KEY=$(jq -r '.key' /tmp/private-key-response.json)
echo "$PRIVATE_KEY" > ./github-app-private-key.pem

# Convertir la clé en base64 pour l'environnement
PRIVATE_KEY_BASE64=$(echo "$PRIVATE_KEY" | base64 -w 0)

# Créer le client secret
echo "🔒 Génération du client secret..."
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /apps/$APP_ID/client-secrets > /tmp/client-secret-response.json

CLIENT_SECRET=$(jq -r '.client_secret' /tmp/client-secret-response.json)

# Générer le fichier .env.local
cat > .env.local << EOF
# GitHub App Configuration (Généré automatiquement)
GITHUB_APP_ID=$APP_ID
GITHUB_CLIENT_ID=$CLIENT_ID
GITHUB_CLIENT_SECRET=$CLIENT_SECRET
GITHUB_PRIVATE_KEY="$PRIVATE_KEY_BASE64"
WEBHOOK_SECRET=$WEBHOOK_SECRET

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/iapostemanage"
EOF

echo "📄 Fichier .env.local créé avec toutes les variables"

# Installer l'app sur le compte/organisation
echo "📦 Installation de l'app..."
INSTALL_URL="https://github.com/apps/$APP_SLUG/installations/new"
echo "🌐 Ouvrir ce lien pour installer l'app: $INSTALL_URL"

# Nettoyer les fichiers temporaires
rm -f /tmp/github-app-config.json /tmp/app-response.json /tmp/private-key-response.json /tmp/client-secret-response.json

echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "📋 Résumé:"
echo "   - App ID: $APP_ID"
echo "   - Client ID: $CLIENT_ID"
echo "   - Clé privée: ./github-app-private-key.pem"
echo "   - Variables d'environnement: ./.env.local"
echo ""
echo "📌 Prochaines étapes:"
echo "   1. Installer l'app: $INSTALL_URL"
echo "   2. Configurer votre domaine dans .env.local"
echo "   3. Démarrer l'application: npm run dev"
echo ""