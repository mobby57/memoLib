#!/bin/bash
# Déploiement complet IA Poste Manager v2.3 Pro

echo "🚀 Déploiement IA Poste Manager v2.3 Pro"
echo "========================================"

# 1. Créer les répertoires
mkdir -p data templates

# 2. Installer les dépendances Python
echo "📦 Installation des dépendances..."
pip3 install --user PyJWT

# 3. Mettre à jour le WSGI
echo "🔧 Configuration WSGI..."
cat > /var/www/sidmoro_pythonanywhere_com_wsgi.py << 'EOF'
import sys
sys.path.insert(0, '/home/sidmoro')

from complete_app import app as application
EOF

# 4. Initialiser les bases de données
echo "🗄️ Initialisation des bases de données..."
python3 -c "
from complete_app import init_db
from auth_system import AuthManager
init_db()
auth = AuthManager()
print('✅ Bases de données initialisées')
"

# 5. Créer le fichier .env avec les nouvelles variables
echo "⚙️ Configuration environnement..."
cat >> .env << 'EOF'

# SMTP Configuration (à configurer)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_NAME=MS CONSEILS

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key_here
EOF

# 6. Test de l'application
echo "🧪 Test de l'application..."
python3 -c "
from complete_app import app
from auth_system import AuthManager
print('✅ Application complète OK')
print('✅ Système d\'authentification OK')
"

echo ""
echo "🎉 Déploiement terminé!"
echo "========================"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurez vos identifiants SMTP dans .env"
echo "2. Rechargez l'application web sur PythonAnywhere"
echo "3. Testez: https://sidmoro.pythonanywhere.com"
echo ""
echo "🔐 Compte admin par défaut:"
echo "Email: admin@msconseils.fr"
echo "Mot de passe: admin123"
echo ""
echo "✨ Nouvelles fonctionnalités:"
echo "• Authentification utilisateur"
echo "• Envoi SMTP réel"
echo "• Templates avancés"
echo "• Statistiques utilisateur"
echo "• Interface sécurisée"