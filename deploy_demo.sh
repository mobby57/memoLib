#!/bin/bash
# EXÉCUTION IMMÉDIATE - DÉMO IA POSTE MANAGER CESEDA

echo "🚀 DÉPLOIEMENT DÉMO EN COURS..."

# 1. Aller dans le répertoire
cd ~/iapostemanage

# 2. Sauvegarder l'ancien code
mv app.py app_backup.py 2>/dev/null || true
mv templates/index.html templates/index_backup.html 2>/dev/null || true

# 3. Déployer la démo
cp demo_app.py app.py
mkdir -p templates
cp demo_index.html templates/index.html

# 4. Créer requirements minimal
echo "Flask==3.0.0" > requirements.txt

# 5. Installer Flask
pip3.10 install --user Flask==3.0.0

# 6. Test rapide
python3.10 -c "from app import app; print('✅ DÉMO PRÊTE')"

echo "✅ DÉMO DÉPLOYÉE - Redémarrez votre web app PythonAnywhere"
echo "🎬 URL: https://sidmoro.pythonanywhere.com/"