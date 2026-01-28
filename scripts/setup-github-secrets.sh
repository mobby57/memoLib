#!/bin/bash
# ==============================================================================
# GitHub Secrets Setup Script for memolib
# ==============================================================================
#
# Ce script aide à configurer les secrets GitHub nécessaires pour le CI/CD.
#
# PRÉREQUIS:
# 1. GitHub CLI installé: https://cli.github.com/
# 2. Authentifié avec: gh auth login
# 3. Permissions admin sur le repository
#
# USAGE:
#   chmod +x scripts/setup-github-secrets.sh
#   ./scripts/setup-github-secrets.sh
#
# ==============================================================================

set -e

echo "🔐 Configuration des Secrets GitHub pour memolib"
echo "========================================================"
echo ""

# Vérifier si gh CLI est installé
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) n'est pas installé."
    echo "   Installez-le: https://cli.github.com/"
    exit 1
fi

# Vérifier l'authentification
if ! gh auth status &> /dev/null; then
    echo "❌ Vous n'êtes pas authentifié avec GitHub CLI."
    echo "   Exécutez: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configuré"
echo ""

# Secrets requis
echo "📋 Secrets requis pour le CI/CD:"
echo "================================="
echo ""
echo "1. AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "   → Obtenu depuis Azure Portal > Static Web Apps > Manage deployment token"
echo ""
echo "2. NEXTAUTH_SECRET"
echo "   → Généré avec: openssl rand -base64 32"
echo ""
echo "3. DATABASE_URL"
echo "   → URL de connexion PostgreSQL (ex: postgresql://user:pass@host:5432/db)"
echo ""
echo "4. TWILIO_AUTH_TOKEN"
echo "   → Obtenu depuis la console Twilio"
echo ""
echo "Note: GITHUB_TOKEN est automatiquement fourni par GitHub Actions"
echo ""

# Fonction pour définir un secret
set_secret() {
    local name=$1
    local prompt=$2

    read -p "Voulez-vous configurer $name? (o/n): " confirm
    if [[ $confirm == "o" || $confirm == "O" ]]; then
        read -sp "$prompt: " value
        echo ""
        if [[ -n "$value" ]]; then
            echo "$value" | gh secret set "$name"
            echo "✅ $name configuré"
        else
            echo "⚠️  Valeur vide, secret non configuré"
        fi
    else
        echo "⏭️  $name ignoré"
    fi
    echo ""
}

echo "🔧 Configuration interactive des secrets"
echo "========================================="
echo ""

# Configurer chaque secret
set_secret "AZURE_STATIC_WEB_APPS_API_TOKEN" "Entrez le token Azure SWA"
set_secret "NEXTAUTH_SECRET" "Entrez le secret NextAuth (ou appuyez sur Entrée pour générer)"
set_secret "DATABASE_URL" "Entrez l'URL de la base de données"
set_secret "TWILIO_AUTH_TOKEN" "Entrez le token Twilio"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Pour vérifier les secrets configurés:"
echo "   gh secret list"
echo ""
echo "🚀 Pour déclencher le workflow CI/CD:"
echo "   git push origin main"
