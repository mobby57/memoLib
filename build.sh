#!/bin/bash
# Build script for IAPosteManager v3.6 - Production Ready
# Includes: Realtime API, Vector Stores, Batch API, Webhooks

set -e

echo "🏗️  CONSTRUCTION IAPOSTEMANAGER v3.6"
echo "===================================="

# Install Python dependencies
echo "📦 Installation des dépendances Python..."
pip install -r requirements.txt

# Build React frontend
echo "⚛️  Construction du frontend React..."
cd frontend-react
npm install
npm run build
cd ..

# Copy built frontend to backend static folder
echo "📁 Copie du frontend vers le backend..."
mkdir -p src/backend/static
cp -r frontend-react/dist/* src/backend/static/

# Create necessary directories
echo "📁 Création des répertoires..."
mkdir -p src/backend/data
mkdir -p src/backend/uploads
mkdir -p src/backend/logs
mkdir -p src/backend/flask_session

echo "✅ Construction terminée avec succès!"
echo "🚀 Prêt pour le déploiement"