#!/bin/bash
# Script de démarrage optimisé pour Render.com

set -e

echo "🚀 DÉMARRAGE IAPOSTEMANAGER"
echo "======================================"

# Variables d'environnement par défaut
export PORT=${PORT:-10000}
export HOST=${HOST:-0.0.0.0}
export FLASK_ENV=${FLASK_ENV:-production}

echo "📊 Configuration:"
echo "   PORT: $PORT"
echo "   HOST: $HOST"
echo "   FLASK_ENV: $FLASK_ENV"
echo "======================================"

# Vérifier que la base de données existe
if [ ! -f "data/production.db" ]; then
    echo "📦 Initialisation de la base de données..."
    python -c "from app import db; db.create_all(); print('✅ Base de données créée')"
fi

# Démarrer l'application
echo "🚀 Lancement du serveur Flask..."
cd src/backend
exec python app.py
