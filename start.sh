#!/bin/bash
# Script de démarrage optimisé pour Render.com avec Gunicorn

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

# Démarrer l'application directement avec Python
echo "🚀 Lancement du serveur Flask..."
cd src/backend
exec python app.py

