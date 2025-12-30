#!/bin/bash
# Script de déploiement des améliorations

echo "Déploiement des améliorations IA Poste Manager..."

# 1. Créer les répertoires nécessaires
mkdir -p templates data

# 2. Copier les nouveaux fichiers
echo "Copie des fichiers améliorés..."

# 3. Mettre à jour le WSGI
cat > /var/www/sidmoro_pythonanywhere_com_wsgi.py << 'EOF'
import sys
sys.path.insert(0, '/home/sidmoro')

from enhanced_app import app as application
EOF

# 4. Installer les dépendances supplémentaires
pip3 install --user flask-cors

# 5. Créer la base de données
python3 -c "from enhanced_app import init_db; init_db()"

# 6. Tester l'application
python3 -c "from enhanced_app import app; print('Application améliorée OK')"

echo "Déploiement terminé!"
echo "Rechargez l'application web sur PythonAnywhere"
echo "Nouvelle URL: https://sidmoro.pythonanywhere.com"