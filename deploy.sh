#!/bin/bash
# Script de déploiement automatique PythonAnywhere

echo "Deploiement IA Poste Manager sur PythonAnywhere"
echo "================================================"

# 1. Test local
echo "1. Test des imports..."
python -c "from src.backend.main_fastapi import app; print('FastAPI OK')"
python -c "from asgiref.wsgi import WsgiToAsgi; print('ASGI Bridge OK')"

# 2. Vérifier les fichiers
echo "2. Verification des fichiers..."
ls -la src/backend/main_fastapi.py
ls -la wsgi_pythonanywhere.py
ls -la requirements.txt
ls -la .env.secure

# 3. Instructions
echo "3. Instructions de deploiement:"
echo "   - Uploadez tous les fichiers sur PythonAnywhere"
echo "   - Copiez .env.secure vers .env et configurez"
echo "   - Installez: pip3.10 install --user -r requirements.txt"
echo "   - Configurez le WSGI file avec wsgi_pythonanywhere.py"
echo "   - Reload l'application web"

echo "================================================"
echo "Pret pour le deploiement!"