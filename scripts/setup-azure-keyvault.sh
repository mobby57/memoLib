#!/bin/bash
# ==============================================================================
# Azure Key Vault Setup Script for iapostemanager
# ==============================================================================
#
# Ce script configure Azure Key Vault pour la gestion des secrets en production.
#
# PRÉREQUIS:
# 1. Azure CLI installé
# 2. Compte Azure avec abonnement actif
# 3. Permissions pour créer des ressources
#
# USAGE:
#   chmod +x scripts/setup-azure-keyvault.sh
#   ./scripts/setup-azure-keyvault.sh
#
# ==============================================================================

set -e

# Configuration
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-iapostemanager-rg}"
KEY_VAULT_NAME="${AZURE_KEY_VAULT_NAME:-iapostemanager-kv}"
LOCATION="${AZURE_LOCATION:-westeurope}"

echo "🔐 Configuration Azure Key Vault pour iapostemanager"
echo "====================================================="
echo ""

# Vérifier si Azure CLI est installé
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI n'est pas installé."
    echo ""
    echo "📥 Installation Azure CLI:"
    echo ""
    echo "Linux (Ubuntu/Debian):"
    echo "  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    echo ""
    echo "macOS:"
    echo "  brew update && brew install azure-cli"
    echo ""
    echo "Windows:"
    echo "  winget install -e --id Microsoft.AzureCLI"
    echo ""
    echo "Après installation, exécutez: az login"
    exit 1
fi

echo "✅ Azure CLI installé"

# Vérifier la connexion
if ! az account show &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Azure."
    echo "   Exécutez: az login"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✅ Connecté à l'abonnement: $SUBSCRIPTION"
echo ""

# Créer le groupe de ressources
echo "📦 Création du groupe de ressources: $RESOURCE_GROUP"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true
echo "✅ Groupe de ressources prêt"

# Créer le Key Vault
echo "🔑 Création du Key Vault: $KEY_VAULT_NAME"
az keyvault create \
    --name "$KEY_VAULT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --enable-rbac-authorization true \
    --output none 2>/dev/null || echo "   (Key Vault existe déjà)"
echo "✅ Key Vault prêt"

# Obtenir l'ID utilisateur actuel
USER_ID=$(az ad signed-in-user show --query id -o tsv 2>/dev/null || echo "")
if [[ -n "$USER_ID" ]]; then
    echo "👤 Attribution des permissions à l'utilisateur actuel..."

    # Attribuer le rôle Key Vault Secrets Officer
    az role assignment create \
        --role "Key Vault Secrets Officer" \
        --assignee "$USER_ID" \
        --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME" \
        --output none 2>/dev/null || true
    echo "✅ Permissions accordées"
fi

echo ""
echo "🔧 Configuration des secrets..."
echo ""

# Fonction pour définir un secret dans Key Vault
set_kv_secret() {
    local name=$1
    local prompt=$2

    read -p "Configurer $name? (o/n): " confirm
    if [[ $confirm == "o" || $confirm == "O" ]]; then
        read -sp "$prompt: " value
        echo ""
        if [[ -n "$value" ]]; then
            az keyvault secret set \
                --vault-name "$KEY_VAULT_NAME" \
                --name "$name" \
                --value "$value" \
                --output none
            echo "✅ $name configuré dans Key Vault"
        else
            echo "⚠️  Valeur vide, secret non configuré"
        fi
    else
        echo "⏭️  $name ignoré"
    fi
}

echo "📋 Secrets de production à configurer:"
echo "======================================="
echo ""

# Configurer les secrets essentiels
set_kv_secret "NEXTAUTH-SECRET" "Secret NextAuth pour JWT"
set_kv_secret "DATABASE-URL" "URL PostgreSQL de production"
set_kv_secret "OPENAI-API-KEY" "Clé API OpenAI"
set_kv_secret "TWILIO-AUTH-TOKEN" "Token Twilio"
set_kv_secret "TWILIO-ACCOUNT-SID" "SID compte Twilio"
set_kv_secret "MICROSOFT-CLIENT-SECRET" "Secret client Microsoft AD"

echo ""
echo "✅ Configuration Azure Key Vault terminée!"
echo ""
echo "📝 Informations de connexion:"
echo "   Key Vault Name: $KEY_VAULT_NAME"
echo "   Key Vault URL: https://$KEY_VAULT_NAME.vault.azure.net/"
echo "   Resource Group: $RESOURCE_GROUP"
echo ""
echo "🔗 Pour lister les secrets:"
echo "   az keyvault secret list --vault-name $KEY_VAULT_NAME --query '[].name' -o tsv"
echo ""
echo "🔗 Pour récupérer un secret:"
echo "   az keyvault secret show --vault-name $KEY_VAULT_NAME --name SECRET-NAME --query value -o tsv"
echo ""
echo "📚 Documentation: https://docs.microsoft.com/azure/key-vault/"
