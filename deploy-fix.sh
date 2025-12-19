#!/bin/bash

# Script de déploiement corrigé pour Python 3.13
echo "🔧 DÉPLOIEMENT IAPOSTEMANAGER - PYTHON 3.13 FIX"
echo "=================================================="

# 1. Nettoyer l'environnement virtuel
echo "🧹 Nettoyage de l'environnement virtuel..."
if [ -d ".venv" ]; then
    rm -rf .venv
fi

# 2. Créer un nouvel environnement virtuel
echo "🐍 Création de l'environnement virtuel Python 3.13..."
python3.13 -m venv .venv || python3 -m venv .venv || python -m venv .venv

# 3. Activer l'environnement virtuel
echo "⚡ Activation de l'environnement virtuel..."
source .venv/bin/activate

# 4. Mettre à jour pip
echo "📦 Mise à jour de pip..."
pip install --upgrade pip

# 5. Installer les dépendances sans eventlet/socketio
echo "📚 Installation des dépendances compatibles Python 3.13..."
pip install Flask==2.3.3
pip install Flask-CORS==4.0.0
pip install Flask-Limiter==3.5.0
pip install "Flask-Session>=0.8.0"
pip install requests==2.31.0
pip install python-dotenv==1.0.0
pip install cryptography==41.0.7
pip install "openai>=1.0.0"
pip install "pytest>=7.0.0"
pip install "pytest-cov>=4.0.0"
pip install "pytest-anyio>=0.0.0"
pip install "selenium>=4.0.0"
pip install "playwright>=1.40.0"
pip install "pyotp>=2.8.0"
pip install qrcode==7.4.2
pip install gunicorn==21.2.0
pip install prometheus-client==0.18.0
pip install Werkzeug==2.3.7
pip install minio==7.2.0

# Dépendances audio optionnelles (peuvent échouer en environnement headless)
echo "🎤 Installation des dépendances audio (optionnelles)..."
pip install SpeechRecognition==3.10.0 || echo "⚠️  SpeechRecognition non installé (normal en environnement headless)"
pip install pyttsx3==2.90 || echo "⚠️  pyttsx3 non installé (normal en environnement headless)"

# 6. Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p src/backend/data
mkdir -p src/backend/uploads
mkdir -p src/backend/logs
mkdir -p src/backend/flask_session

# 7. Vérifier la configuration
echo "🔍 Vérification de la configuration..."
cd src/backend
python -c "
import sys
print(f'Python version: {sys.version}')
try:
    import flask
    print(f'Flask version: {flask.__version__}')
except ImportError as e:
    print(f'Flask import error: {e}')

try:
    import flask_cors
    print('Flask-CORS: OK')
except ImportError:
    print('Flask-CORS: ERREUR')

try:
    import cryptography
    print('Cryptography: OK')
except ImportError:
    print('Cryptography: ERREUR')

try:
    import openai
    print('OpenAI: OK')
except ImportError:
    print('OpenAI: ERREUR')

print('Configuration vérifiée!')
"

# 8. Test de démarrage
echo "🚀 Test de démarrage de l'application..."
timeout 10s python app.py &
APP_PID=$!
sleep 5

if kill -0 $APP_PID 2>/dev/null; then
    echo "✅ Application démarrée avec succès!"
    kill $APP_PID
else
    echo "❌ Erreur de démarrage"
fi

echo ""
echo "=================================================="
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "=================================================="
echo "Pour démarrer l'application:"
echo "  cd src/backend"
echo "  source ../../.venv/bin/activate"
echo "  python app.py"
echo ""
echo "Corrections appliquées:"
echo "  ✅ SocketIO désactivé (incompatible Python 3.13)"
echo "  ✅ Eventlet supprimé"
echo "  ✅ Endpoints REST ajoutés pour remplacer WebSocket"
echo "  ✅ Dépendances audio optionnelles"
echo "  ✅ Configuration Flask pure"
echo "=================================================="