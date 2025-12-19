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

# Démarrer l'application avec Gunicorn pour production
echo "🚀 Lancement avec Gunicorn (production)..."
cd src/backend
exec gunicorn --worker-class eventlet --workers 1 --bind $HOST:$PORT --timeout 120 --access-logfile - --error-logfile - app:app

