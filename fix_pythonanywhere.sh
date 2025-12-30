#!/bin/bash
# Script de correction rapide PythonAnywhere

echo "🚨 CORRECTION RAPIDE - IA Poste Manager"

# 1. Supprimer l'ancien code FastAPI
rm -rf src/

# 2. Créer la structure Flask
mkdir -p templates static

# 3. Copier les fichiers corrects
cp app_expert.py app.py
cp requirements_expert.txt requirements.txt
cp templates/index_expert.html templates/index.html

# 4. Installer les dépendances Flask
pip3.10 install --user Flask==3.0.0 python-dotenv==1.0.0

# 5. Test rapide
python3.10 -c "from app import app; print('✅ Flask App OK')"

echo "✅ Correction terminée - Redémarrez votre web app"