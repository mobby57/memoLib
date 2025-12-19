#!/bin/bash
# Script de démarrage optimisé pour Render.com - Python 3.13 compatible

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
echo "   PYTHON: $(python --version 2>&1 || echo 'Python non trouvé')"
echo "======================================"

# Vérifier les dépendances critiques
echo "🔍 Vérification des dépendances..."
python -c "
try:
    import flask
    print('✅ Flask OK')
except ImportError:
    print('❌ Flask manquant')
    exit(1)

try:
    import flask_cors
    print('✅ Flask-CORS OK')
except ImportError:
    print('❌ Flask-CORS manquant')
    exit(1)

print('✅ Dépendances vérifiées')
"

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p src/backend/data
mkdir -p src/backend/uploads
mkdir -p src/backend/logs
mkdir -p src/backend/flask_session

# Démarrer l'application
echo "🚀 Lancement du serveur Flask (Python 3.13 compatible - threading mode)..."
cd src/backend

# Utiliser python app.py pour Flask-SocketIO avec mode threading (pas Gunicorn)
# Gunicorn ne supporte pas correctement Flask-SocketIO avec threading
echo "🐍 Démarrage avec socketio.run() en mode threading..."
exec python app.py

