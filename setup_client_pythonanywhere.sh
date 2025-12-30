#!/bin/bash
# setup_client_pythonanywhere.sh

echo "🚀 Configuration client PythonAnywhere"

# Charger configuration
source client_config.env

# Créer dossier client
mkdir -p ~/mysite/clients/$CLIENT_ID
cd ~/mysite/clients/$CLIENT_ID

# Créer structure
mkdir -p data/{dossiers,factures,templates,ceseda}

# Copier fichier .env
cp ~/mysite/client_config.env .env

# Permissions
chmod 755 data
chmod 644 .env

echo "✅ Client $CLIENT_NAME configuré dans ~/mysite/clients/$CLIENT_ID"
echo "📁 Structure créée avec isolation complète"