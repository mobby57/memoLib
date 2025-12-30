#!/bin/bash
# Script d'installation PythonAnywhere - Version corrigée

echo "Installation IA Poste Manager..."

# 1. Installer dépendances
pip3 install --user -r requirements.txt
pip3 install --user asgiref

# 2. Créer répertoires
mkdir -p data/logs

# 3. Copier configuration
cp .env.secure .env

# 4. Tester installation
python3 -c "from src.backend.main_fastapi import app; print('FastAPI OK')"
python3 -c "from asgiref.wsgi import WsgiToAsgi; print('ASGI Bridge OK')"

echo "Installation terminee!"
echo "Configurez maintenant le fichier WSGI et reloadez l'app"