#!/bin/bash
# Script de déploiement PythonAnywhere
# À exécuter dans la console Bash de PythonAnywhere

echo "🚀 Déploiement IA Poste Manager sur PythonAnywhere"
echo "=================================================="

# Variables
APP_DIR="$HOME/iapostemanage"
PYTHON_VERSION="3.10"

# 1. Créer répertoire application
echo "📁 Création répertoire application..."
mkdir -p $APP_DIR
cd $APP_DIR

# 2. Installer dépendances
echo "📦 Installation dépendances Python..."
pip3.${PYTHON_VERSION} install --user -r requirements_pythonanywhere.txt

# 3. Vérifier fichiers
echo "✅ Vérification fichiers..."
if [ -f "run_server.py" ]; then
    echo "  ✓ run_server.py trouvé"
else
    echo "  ❌ run_server.py manquant"
fi

if [ -f ".env" ]; then
    echo "  ✓ .env trouvé"
else
    echo "  ⚠️  .env manquant - copier depuis .env_pythonanywhere"
    cp .env_pythonanywhere .env
fi

# 4. Tester import
echo "🧪 Test import application..."
python3.${PYTHON_VERSION} -c "from run_server import app; print('✓ Import réussi')"

# 5. Instructions finales
echo ""
echo "✅ Installation terminée !"
echo ""
echo "📝 Étapes restantes:"
echo "1. Web → Add new web app → Flask → Python 3.10"
echo "2. Source code: $APP_DIR"
echo "3. WSGI file: /var/www/yourusername_pythonanywhere_com_wsgi.py"
echo "4. Copier contenu de wsgi_pythonanywhere.py dans WSGI file"
echo "5. Remplacer 'yourusername' par votre nom d'utilisateur"
echo "6. Configurer .env avec vos clés API"
echo "7. Reload web app"
echo ""
echo "🌐 URL: https://yourusername.pythonanywhere.com"
