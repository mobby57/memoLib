#!/bin/bash
set -e

echo "SecureVault v2.1 - Starting..."

# Vérifier les variables d'environnement
if [ -z "$SECRET_KEY" ]; then
    echo "WARNING: SECRET_KEY not set, using default (not for production!)"
fi

# Créer les dossiers nécessaires
mkdir -p logs data/encrypted data/uploads

# Attendre que les services soient prêts
if [ -n "$REDIS_HOST" ]; then
    echo "Waiting for Redis..."
    while ! nc -z $REDIS_HOST 6379; do
        sleep 1
    done
    echo "Redis is ready!"
fi

# Lancer l'application
echo "Starting Flask application..."
exec python src/web/app.py
