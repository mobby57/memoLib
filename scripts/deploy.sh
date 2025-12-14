#!/bin/bash
# Script deploiement automatique

echo "Deploiement SecureVault v2.1"

# Variables
ENV=${1:-production}
PLATFORM=${2:-heroku}

echo "Environnement: $ENV"
echo "Plateforme: $PLATFORM"

# Tests
echo "Execution tests..."
python run_tests.py
if [ $? -ne 0 ]; then
    echo "ERREUR: Tests echoues"
    exit 1
fi

# Build
echo "Build application..."
if [ "$PLATFORM" = "heroku" ]; then
    git push heroku main
elif [ "$PLATFORM" = "railway" ]; then
    railway up
elif [ "$PLATFORM" = "render" ]; then
    render deploy
else
    echo "Plateforme inconnue: $PLATFORM"
    exit 1
fi

echo "Deploiement termine"
